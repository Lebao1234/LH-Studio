import mongoose from 'mongoose';
import { TASK_OPEN_STATUS } from '../../shared/constants/enums.js';
import { addDays, zonedMonthRange } from '../../shared/utils/dates.js';
import { accessibleProjectIds } from '../projects/project.access.js';
import { Project } from '../projects/project.model.js';
import { Episode } from '../episodes/episode.model.js';
import { Task } from '../tasks/task.model.js';
import { TaskAssignment } from '../tasks/taskAssignment.model.js';
import { Post } from '../posts/post.model.js';
import { StudioMember } from '../studios/studioMember.model.js';
import * as finance from '../finances/finance.service.js';

const { ObjectId } = mongoose.Types;

/** Studio-wide project ids visible to the caller. */
async function scope(ctx) {
  const studioId = new ObjectId(ctx.studioId);
  const accessible = await accessibleProjectIds(ctx);
  const projectIds = accessible ?? (await Project.find({ studioId }).distinct('_id'));
  return { studioId, projectIds };
}

const countBy = (rows) => Object.fromEntries(rows.map((r) => [r._id ?? 'none', r.count]));

export async function overview(ctx) {
  const { studioId, projectIds } = await scope(ctx);
  const now = new Date();
  const taskMatch = { studioId, projectId: { $in: projectIds } };
  const myTaskIds = await TaskAssignment.distinct('taskId', { userId: ctx.userId });

  const [activeProjects, totalProjects, totalEpisodes, completedEpisodes, pendingTasks, completedTasks, overdueTasks, myOpenTasks, upcomingPosts, members] =
    await Promise.all([
      Project.countDocuments({ _id: { $in: projectIds }, status: { $in: ['planning', 'in_progress'] } }),
      Project.countDocuments({ _id: { $in: projectIds } }),
      Episode.countDocuments({ projectId: { $in: projectIds } }),
      Episode.countDocuments({ projectId: { $in: projectIds }, status: 'completed' }),
      Task.countDocuments({ ...taskMatch, status: { $in: TASK_OPEN_STATUS } }),
      Task.countDocuments({ ...taskMatch, status: 'done' }),
      Task.countDocuments({ ...taskMatch, status: { $in: TASK_OPEN_STATUS }, dueDate: { $lt: now } }),
      Task.countDocuments({ studioId, _id: { $in: myTaskIds }, status: { $in: TASK_OPEN_STATUS } }),
      Post.countDocuments({ studioId, status: 'scheduled', scheduledAt: { $gte: now, $lte: addDays(now, 7) } }),
      StudioMember.countDocuments({ studioId, status: 'active' }),
    ]);

  return {
    activeProjects,
    totalProjects,
    totalEpisodes,
    completedEpisodes,
    pendingTasks,
    completedTasks,
    overdueTasks,
    myOpenTasks,
    upcomingPosts,
    members,
    recentActivity: await recentActivity(studioId, projectIds),
  };
}

/**
 * V1 has no activity-log collection; "recent activity" is derived from the most
 * recently updated production records.
 */
async function recentActivity(studioId, projectIds, limit = 12) {
  const [tasks, episodes, posts, projects] = await Promise.all([
    Task.find({ studioId, projectId: { $in: projectIds } })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select('title status updatedAt createdAt projectId')
      .populate({ path: 'projectId', select: 'code title' })
      .lean(),
    Episode.find({ projectId: { $in: projectIds } })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select('title episodeNumber status updatedAt createdAt projectId')
      .populate({ path: 'projectId', select: 'code title' })
      .lean(),
    Post.find({ studioId })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select('title status updatedAt createdAt channelId')
      .populate({ path: 'channelId', select: 'name platform' })
      .lean(),
    Project.find({ _id: { $in: projectIds } }).sort({ updatedAt: -1 }).limit(limit).select('title code status updatedAt createdAt').lean(),
  ]);

  const action = (doc) => (Math.abs(new Date(doc.updatedAt) - new Date(doc.createdAt)) < 2000 ? 'created' : 'updated');
  return [
    ...tasks.map((t) => ({ kind: 'task', id: t._id, title: t.title, status: t.status, at: t.updatedAt, action: action(t), project: t.projectId })),
    ...episodes.map((e) => ({
      kind: 'episode',
      id: e._id,
      title: `Tập ${e.episodeNumber}: ${e.title}`,
      status: e.status,
      at: e.updatedAt,
      action: action(e),
      project: e.projectId,
    })),
    ...posts.map((p) => ({ kind: 'post', id: p._id, title: p.title, status: p.status, at: p.updatedAt, action: action(p), channel: p.channelId })),
    ...projects.map((p) => ({ kind: 'project', id: p._id, title: `${p.code} · ${p.title}`, status: p.status, at: p.updatedAt, action: action(p) })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, limit);
}

export async function projectStatus(ctx) {
  const { projectIds } = await scope(ctx);
  const [projects, episodes] = await Promise.all([
    Project.aggregate([{ $match: { _id: { $in: projectIds } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Episode.aggregate([{ $match: { projectId: { $in: projectIds } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  return { projects: countBy(projects), episodes: countBy(episodes) };
}

export async function tasksSummary(ctx) {
  const { studioId, projectIds } = await scope(ctx);
  const now = new Date();
  const match = { studioId, projectId: { $in: projectIds } };
  const myTaskIds = await TaskAssignment.distinct('taskId', { userId: new ObjectId(ctx.userId) });

  const [byStatus, byPriority, overdue, myOpen, myOverdue, completedLast7Days] = await Promise.all([
    Task.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Task.aggregate([{ $match: { ...match, status: { $in: TASK_OPEN_STATUS } } }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Task.countDocuments({ ...match, status: { $in: TASK_OPEN_STATUS }, dueDate: { $lt: now } }),
    Task.countDocuments({ studioId, _id: { $in: myTaskIds }, status: { $in: TASK_OPEN_STATUS } }),
    Task.countDocuments({ studioId, _id: { $in: myTaskIds }, status: { $in: TASK_OPEN_STATUS }, dueDate: { $lt: now } }),
    Task.countDocuments({ ...match, status: 'done', completedAt: { $gte: addDays(now, -7) } }),
  ]);

  return { byStatus: countBy(byStatus), byPriority: countBy(byPriority), overdue, mine: { open: myOpen, overdue: myOverdue }, completedLast7Days };
}

export async function upcomingPosts(ctx, { days = 14, limit = 10 } = {}) {
  const now = new Date();
  const items = await Post.find({ studioId: ctx.studioId, status: 'scheduled', scheduledAt: { $gte: now, $lte: addDays(now, days) } })
    .select('title status scheduledAt channelId projectId')
    .populate({ path: 'channelId', select: 'name platform avatarUrl' })
    .populate({ path: 'projectId', select: 'code title' })
    .sort({ scheduledAt: 1 })
    .limit(limit)
    .lean();
  return items.map(({ channelId, projectId, ...p }) => ({ ...p, id: String(p._id), channel: channelId, project: projectId }));
}

export async function financialSummary(ctx) {
  const { start, end } = zonedMonthRange(ctx.studio?.timezone);
  const [month, cashflow] = await Promise.all([
    finance.getSummary(ctx, { from: start, to: new Date(end.getTime() - 1) }),
    finance.monthlyCashflow(ctx, { months: 6 }),
  ]);
  return { month, cashflow };
}
