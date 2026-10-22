import mongoose from 'mongoose';
import { withTransaction } from '../../shared/db/transaction.js';
import { forbidden, notFound, unprocessable } from '../../shared/errors/AppError.js';
import { buildSort, paginationMeta, toSkip } from '../../shared/utils/pagination.js';
import { compact, escapeRegex } from '../../shared/utils/validators.js';
import { USER_PUBLIC_FIELDS } from '../users/user.model.js';
import { Channel } from '../channels/channel.model.js';
import { Episode } from '../episodes/episode.model.js';
import { isStudioManager, loadProjectWithAccess } from '../projects/project.access.js';
import { Post } from './post.model.js';
import { PostMetric } from './postMetric.model.js';

const SORTABLE = ['title', 'scheduledAt', 'publishedAt', 'createdAt', 'updatedAt', 'status'];
const CLOCK_SKEW_MS = 5 * 60_000;

const POPULATE = [
  { path: 'channelId', select: 'platform name handle avatarUrl status' },
  { path: 'projectId', select: 'code title' },
  { path: 'episodeId', select: 'episodeNumber title' },
];

function shape(post) {
  const { channelId, projectId, episodeId, ...rest } = post;
  return {
    ...rest,
    id: String(post._id),
    channelId: channelId?._id ?? channelId,
    channel: channelId && typeof channelId === 'object' && channelId.name ? channelId : null,
    projectId: projectId?._id ?? projectId ?? null,
    project: projectId && projectId.title ? projectId : null,
    episodeId: episodeId?._id ?? episodeId ?? null,
    episode: episodeId && episodeId.title ? episodeId : null,
  };
}

async function attachLatestMetrics(posts) {
  if (!posts.length) return posts;
  const latest = await PostMetric.aggregate([
    { $match: { postId: { $in: posts.map((p) => p._id) } } },
    { $sort: { recordedAt: -1 } },
    { $group: { _id: '$postId', metric: { $first: '$$ROOT' } } },
  ]);
  const byPost = new Map(latest.map((m) => [String(m._id), m.metric]));
  return posts.map((p) => ({ ...p, latestMetric: byPost.get(String(p._id)) ?? null }));
}

/**
 * Validates every cross-collection rule against the post's final state
 * (existing values merged with the requested changes).
 */
async function validateRelations(ctx, final, { channelChanged, linkChanged }) {
  const channel = await Channel.findOne({ _id: final.channelId, studioId: ctx.studioId }).lean();
  if (!channel) throw unprocessable('Kênh không thuộc studio.', 'INVALID_CHANNEL');
  if (channelChanged && channel.status !== 'active') throw unprocessable('Kênh đã ngừng hoạt động.', 'CHANNEL_INACTIVE');

  if (final.episodeId && !final.projectId) {
    throw unprocessable('Bài viết gắn tập phim phải chọn dự án tương ứng.', 'EPISODE_REQUIRES_PROJECT');
  }
  if (final.projectId && linkChanged) {
    // Throws 404 if the project is outside the studio or not visible to the caller.
    await loadProjectWithAccess(ctx, final.projectId);
  }
  if (final.episodeId && linkChanged) {
    const ok = await Episode.exists({ _id: final.episodeId, projectId: final.projectId });
    if (!ok) throw unprocessable('Tập phim không thuộc dự án đã chọn.', 'EPISODE_PROJECT_MISMATCH');
  }
}

function applyStatusRules(ctx, final, changes, previousStatus) {
  const now = Date.now();
  if (final.status === 'scheduled') {
    if (!final.scheduledAt) throw unprocessable('Bài viết đã lên lịch cần thời gian đăng hợp lệ.', 'SCHEDULE_REQUIRED');
    const timeChanged = changes.scheduledAt !== undefined || previousStatus !== 'scheduled';
    if (timeChanged && new Date(final.scheduledAt).getTime() < now - CLOCK_SKEW_MS) {
      throw unprocessable('Thời gian lên lịch phải ở tương lai.', 'SCHEDULE_IN_PAST');
    }
  }
  if (final.status === 'published') {
    if (!final.publishedAt) {
      final.publishedAt = new Date();
      changes.publishedAt = final.publishedAt;
    }
    if (new Date(final.publishedAt).getTime() > now + CLOCK_SKEW_MS) {
      throw unprocessable('Thời gian đăng không thể ở tương lai.', 'PUBLISHED_IN_FUTURE');
    }
    if (previousStatus !== 'published') changes.publishedBy = ctx.userId;
  }
}

async function buildFilter(ctx, q) {
  const filter = { studioId: new mongoose.Types.ObjectId(ctx.studioId) };
  if (q.status) filter.status = { $in: q.status };
  if (q.channelId) filter.channelId = new mongoose.Types.ObjectId(q.channelId);
  if (q.platform) {
    const ids = await Channel.find({ studioId: ctx.studioId, platform: q.platform }).distinct('_id');
    filter.channelId = q.channelId ? { $in: ids.filter((id) => String(id) === q.channelId) } : { $in: ids };
  }
  if (q.independent) filter.projectId = null;
  else if (q.projectId) filter.projectId = new mongoose.Types.ObjectId(q.projectId);
  if (q.episodeId) filter.episodeId = new mongoose.Types.ObjectId(q.episodeId);
  if (q.search) filter.title = new RegExp(escapeRegex(q.search), 'i');
  if (q.from || q.to) {
    const range = { ...(q.from ? { $gte: q.from } : {}), ...(q.to ? { $lte: q.to } : {}) };
    filter.$or = [{ scheduledAt: range }, { publishedAt: range }];
  }
  return filter;
}

export async function findPosts(ctx, q) {
  const filter = await buildFilter(ctx, q);
  const [items, total] = await Promise.all([
    Post.find(filter).populate(POPULATE).sort(buildSort(q.sort, SORTABLE, '-updatedAt')).skip(toSkip(q)).limit(q.limit).lean(),
    Post.countDocuments(filter),
  ]);
  return { items: (await attachLatestMetrics(items)).map(shape), meta: paginationMeta(q, total) };
}

export async function calendar(ctx, q) {
  const filter = await buildFilter(ctx, { ...q, from: q.start, to: q.end });
  const items = await Post.find(filter).select('-content').populate(POPULATE).sort({ scheduledAt: 1, publishedAt: 1 }).limit(1000).lean();
  return items.map((p) => ({ ...shape(p), date: p.publishedAt ?? p.scheduledAt }));
}

async function loadPost(ctx, postId) {
  if (!mongoose.isValidObjectId(postId)) throw notFound('Không tìm thấy bài viết.');
  const post = await Post.findOne({ _id: postId, studioId: ctx.studioId });
  if (!post) throw notFound('Không tìm thấy bài viết.');
  return post;
}

export async function getPost(ctx, postId) {
  const post = await loadPost(ctx, postId);
  await post.populate([...POPULATE, { path: 'createdBy', select: USER_PUBLIC_FIELDS }, { path: 'publishedBy', select: USER_PUBLIC_FIELDS }]);
  const [withMetric] = await attachLatestMetrics([post.toJSON()]);
  return shape(withMetric);
}

export async function createPost(ctx, input) {
  const changes = compact(input);
  const final = { status: 'draft', projectId: null, episodeId: null, ...changes };
  await validateRelations(ctx, final, { channelChanged: true, linkChanged: true });
  applyStatusRules(ctx, final, changes, null);

  const post = await Post.create({ ...final, ...changes, studioId: ctx.studioId, createdBy: ctx.userId });
  return getPost(ctx, post._id);
}

export async function updatePost(ctx, postId, input) {
  const post = await loadPost(ctx, postId);
  const changes = compact(input);

  // Clearing the project also clears the episode link.
  if (changes.projectId === null && changes.episodeId === undefined) changes.episodeId = null;

  const final = { ...post.toObject(), ...changes };
  await validateRelations(ctx, final, {
    channelChanged: changes.channelId !== undefined && String(changes.channelId) !== String(post.channelId),
    linkChanged: changes.projectId !== undefined || changes.episodeId !== undefined,
  });
  applyStatusRules(ctx, final, changes, post.status);

  post.set(changes);
  await post.save();
  return getPost(ctx, post._id);
}

export async function deletePost(ctx, postId) {
  const post = await loadPost(ctx, postId);
  const isOwner = String(post.createdBy) === ctx.userId;
  if (post.status === 'published' && !isStudioManager(ctx)) {
    throw forbidden('Chỉ quản trị viên được xóa bài đã đăng.');
  }
  if (!isOwner && !isStudioManager(ctx)) throw forbidden('Chỉ người tạo hoặc quản trị viên được xóa bài viết.');

  await withTransaction(async (session) => {
    await PostMetric.deleteMany({ postId: post._id }, { session });
    await Post.deleteOne({ _id: post._id }, { session });
  });
}

export async function listMetrics(ctx, postId) {
  const post = await loadPost(ctx, postId);
  return PostMetric.find({ postId: post._id })
    .populate({ path: 'recordedBy', select: 'name' })
    .sort({ recordedAt: -1 })
    .limit(200)
    .lean();
}

export async function addMetric(ctx, postId, input) {
  const post = await loadPost(ctx, postId);
  const recordedAt = input.recordedAt ?? new Date();
  if (recordedAt.getTime() > Date.now() + CLOCK_SKEW_MS) {
    throw unprocessable('Thời điểm ghi nhận không thể ở tương lai.', 'METRIC_IN_FUTURE');
  }
  return PostMetric.create({ ...compact(input), recordedAt, postId: post._id, source: 'manual', recordedBy: ctx.userId });
}
