import mongoose from 'mongoose';
import { withTransaction } from '../../shared/db/transaction.js';
import { EPISODE_WRITE_ROLES, TASK_OPEN_STATUS } from '../../shared/constants/enums.js';
import { conflict, forbidden, notFound, unprocessable } from '../../shared/errors/AppError.js';
import { buildSort, paginationMeta, toSkip } from '../../shared/utils/pagination.js';
import { compact, escapeRegex } from '../../shared/utils/validators.js';
import { USER_PUBLIC_FIELDS } from '../users/user.model.js';
import { assertAssignable, loadProjectWithAccess } from '../projects/project.access.js';
import { Task } from '../tasks/task.model.js';
import { Post } from '../posts/post.model.js';
import { Episode } from './episode.model.js';

const SORTABLE = ['episodeNumber', 'title', 'dueDate', 'status', 'createdAt', 'updatedAt'];

function applyCompletion(target, status) {
  if (!status) return;
  if (status === 'completed' && !target.completedAt) target.completedAt = new Date();
  if (status !== 'completed') target.completedAt = null;
}

function rethrowDuplicate(err) {
  if (err?.code === 11000) throw conflict('Số tập đã tồn tại trong dự án.', 'EPISODE_NUMBER_TAKEN');
  throw err;
}

export async function listEpisodes(ctx, projectId, q) {
  const { project } = await loadProjectWithAccess(ctx, projectId);
  const filter = { projectId: project._id };
  if (q.status) filter.status = { $in: q.status };
  if (q.search) filter.title = new RegExp(escapeRegex(q.search), 'i');

  const [items, total] = await Promise.all([
    Episode.find(filter)
      .select('-script')
      .populate({ path: 'assignedTo', select: USER_PUBLIC_FIELDS })
      .sort(buildSort(q.sort, SORTABLE, 'episodeNumber'))
      .skip(toSkip(q))
      .limit(q.limit)
      .lean(),
    Episode.countDocuments(filter),
  ]);

  const ids = items.map((e) => e._id);
  const taskStats = await Task.aggregate([
    { $match: { episodeId: { $in: ids } } },
    {
      $group: {
        _id: '$episodeId',
        total: { $sum: 1 },
        open: { $sum: { $cond: [{ $in: ['$status', TASK_OPEN_STATUS] }, 1, 0] } },
      },
    },
  ]);
  const byId = new Map(taskStats.map((s) => [String(s._id), { total: s.total, open: s.open }]));

  return {
    items: items.map((e) => ({ ...e, id: String(e._id), tasks: byId.get(String(e._id)) ?? { total: 0, open: 0 } })),
    meta: paginationMeta(q, total),
  };
}

/** Loads an episode and verifies it belongs to a project of the caller's studio. */
async function loadEpisode(ctx, episodeId, accessOpts) {
  if (!mongoose.isValidObjectId(episodeId)) throw notFound('Không tìm thấy tập phim.');
  const episode = await Episode.findById(episodeId);
  if (!episode) throw notFound('Không tìm thấy tập phim.');
  const access = await loadProjectWithAccess(ctx, episode.projectId, accessOpts).catch((err) => {
    if (err.status === 404) throw notFound('Không tìm thấy tập phim.');
    throw err;
  });
  return { episode, ...access };
}

export async function getEpisode(ctx, episodeId) {
  const { episode, project, projectRole } = await loadEpisode(ctx, episodeId);
  await episode.populate({ path: 'assignedTo', select: USER_PUBLIC_FIELDS });
  return {
    ...episode.toJSON(),
    project: { _id: project._id, id: String(project._id), code: project.code, title: project.title },
    myProjectRole: projectRole,
  };
}

export async function createEpisode(ctx, projectId, input) {
  const { project } = await loadProjectWithAccess(ctx, projectId, { write: true, roles: EPISODE_WRITE_ROLES });
  if (input.assignedTo) await assertAssignable(ctx, project._id, input.assignedTo);

  const doc = { ...compact(input), projectId: project._id, createdBy: ctx.userId };
  if (doc.episodeNumber === undefined) {
    const last = await Episode.findOne({ projectId: project._id }).sort({ episodeNumber: -1 }).select('episodeNumber').lean();
    doc.episodeNumber = (last?.episodeNumber ?? 0) + 1;
  }
  if (!doc.code && project.code) {
    const pad = String(doc.episodeNumber).padStart(2, '0');
    doc.code = `${project.code}-E${pad}`;
  }
  applyCompletion(doc, doc.status);
  return Episode.create(doc).catch(rethrowDuplicate);
}

export async function updateEpisode(ctx, episodeId, input) {
  const { episode, project, projectRole, isManager } = await loadEpisode(ctx, episodeId);
  if (ctx.role === 'viewer') throw forbidden('Tài khoản chỉ có quyền xem.', 'READ_ONLY');

  const canEdit = isManager || EPISODE_WRITE_ROLES.includes(projectRole);
  const isAssignee = episode.assignedTo && String(episode.assignedTo) === ctx.userId;
  if (!canEdit && !isAssignee) throw forbidden();

  const changes = compact(input);
  if (!canEdit && changes.assignedTo !== undefined) throw forbidden('Bạn không thể đổi người phụ trách.');
  if (changes.assignedTo) await assertAssignable(ctx, project._id, changes.assignedTo);

  const startDate = changes.startDate !== undefined ? changes.startDate : episode.startDate;
  const dueDate = changes.dueDate !== undefined ? changes.dueDate : episode.dueDate;
  if (startDate && dueDate && dueDate < startDate) throw unprocessable('Hạn chót phải sau ngày bắt đầu.', 'INVALID_DATE_RANGE');

  applyCompletion(changes, changes.status);
  episode.set(changes);
  await episode.save().catch(rethrowDuplicate);
  return episode;
}

export async function deleteEpisode(ctx, episodeId) {
  const { episode } = await loadEpisode(ctx, episodeId, { write: true, roles: ['manager'] });
  await withTransaction(async (session) => {
    await Task.updateMany({ episodeId: episode._id }, { $set: { episodeId: null } }, { session });
    await Post.updateMany({ episodeId: episode._id }, { $set: { episodeId: null } }, { session });
    await Episode.deleteOne({ _id: episode._id }, { session });
  });
}
