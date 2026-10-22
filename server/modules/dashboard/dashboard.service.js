import mongoose from 'mongoose';
import { TASK_OPEN_STATUS } from '../../shared/constants/enums.js';
import { addDays, dayKey, zonedCalendarDate, zonedDayStart, zonedMonthRange } from '../../shared/utils/dates.js';
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

  const [activeProjects, totalProjects, totalEpisodes, completedEpisodes, pendingTasks, completedTasks, overdueTasks, myOpenTasks, upcomingPosts, members, postsByPlatform] =
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
      Post.aggregate([
        { $match: { studioId, status: { $ne: 'cancelled' } } },
        { $lookup: { from: 'channels', localField: 'channelId', foreignField: '_id', as: 'channel' } },
        { $group: { _id: { $ifNull: [{ $first: '$channel.platform' }, 'other'] }, count: { $sum: 1 } } },
      ]),
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
    postsByPlatform: countBy(postsByPlatform),
    recentActivity: await recentActivity(studioId, projectIds),
  };
}

export const PRODUCTION_PERIODS = ['week', 'month', 'quarter'];
const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/**
 * Calendar days of the current period (studio time zone) and how they group into chart buckets:
 * week → 7 daily buckets (Mon–Sun), month → daily buckets, quarter → 7-day buckets.
 * `previous` is the period immediately before, used for the "vs last period" comparison.
 */
function periodLayout(period, tz) {
  const today = zonedCalendarDate(tz);
  let start;
  let length;
  let prevStart;
  if (period === 'month') {
    start = { y: today.y, m: today.m, d: 1 };
    length = new Date(Date.UTC(today.y, today.m + 1, 0)).getUTCDate();
    prevStart = { y: today.y, m: today.m - 1, d: 1 };
  } else if (period === 'quarter') {
    const qm = today.m - (today.m % 3);
    start = { y: today.y, m: qm, d: 1 };
    length = Math.round((Date.UTC(today.y, qm + 3, 1) - Date.UTC(today.y, qm, 1)) / 86_400_000);
    prevStart = { y: today.y, m: qm - 3, d: 1 };
  } else {
    const weekday = (new Date(Date.UTC(today.y, today.m, today.d)).getUTCDay() + 6) % 7; // Mon = 0
    start = { y: today.y, m: today.m, d: today.d - weekday };
    length = 7;
    prevStart = { y: start.y, m: start.m, d: start.d - 7 };
  }

  const days = Array.from({ length }, (_, i) => dayKey(start.y, start.m, start.d + i));
  const bucketOf = (i) => (period === 'quarter' ? Math.floor(i / 7) : i);
  const buckets = [];
  days.forEach((key, i) => {
    const b = bucketOf(i);
    if (!buckets[b]) {
      const [, mm, dd] = key.split('-');
      const label = period === 'week' ? WEEKDAY_LABELS[i] : period === 'month' ? `${dd}/${mm}` : `Tuần ${b + 1}`;
      buckets[b] = { key, label, days: [] };
    }
    buckets[b].days.push(key);
  });

  return {
    from: zonedDayStart(tz, start.y, start.m, start.d),
    to: zonedDayStart(tz, start.y, start.m, start.d + length),
    prevFrom: zonedDayStart(tz, prevStart.y, prevStart.m, prevStart.d),
    buckets,
  };
}

/**
 * Production throughput for the current week / month / quarter, from real records:
 * posts published (publishedAt), tasks completed (completedAt) and tasks due (dueDate, not cancelled).
 */
export async function production(ctx, { period = 'week' } = {}) {
  if (!PRODUCTION_PERIODS.includes(period)) period = 'week';
  const tz = ctx.studio?.timezone || 'Asia/Ho_Chi_Minh';
  const { studioId, projectIds } = await scope(ctx);
  const { from, to, prevFrom, buckets } = periodLayout(period, tz);
  const taskMatch = { studioId, projectId: { $in: projectIds } };
  const perDay = (field) => [{ $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: `$${field}`, timezone: tz } }, count: { $sum: 1 } } }];

  const [published, completed, due, prevPublished, prevCompleted] = await Promise.all([
    Post.aggregate([{ $match: { studioId, status: 'published', publishedAt: { $gte: from, $lt: to } } }, ...perDay('publishedAt')]),
    Task.aggregate([{ $match: { ...taskMatch, status: 'done', completedAt: { $gte: from, $lt: to } } }, ...perDay('completedAt')]),
    Task.aggregate([{ $match: { ...taskMatch, status: { $ne: 'cancelled' }, dueDate: { $gte: from, $lt: to } } }, ...perDay('dueDate')]),
    Post.countDocuments({ studioId, status: 'published', publishedAt: { $gte: prevFrom, $lt: from } }),
    Task.countDocuments({ ...taskMatch, status: 'done', completedAt: { $gte: prevFrom, $lt: from } }),
  ]);

  const byDay = (rows) => new Map(rows.map((r) => [r._id, r.count]));
  const maps = { published: byDay(published), tasksCompleted: byDay(completed), tasksDue: byDay(due) };
  const sum = (map, days) => days.reduce((acc, d) => acc + (map.get(d) ?? 0), 0);

  const series = buckets.map(({ days, ...b }) => ({
    ...b,
    published: sum(maps.published, days),
    tasksCompleted: sum(maps.tasksCompleted, days),
    tasksDue: sum(maps.tasksDue, days),
  }));
  const total = (field) => series.reduce((acc, s) => acc + s[field], 0);

  return {
    period,
    from,
    to,
    series,
    totals: { published: total('published'), tasksCompleted: total('tasksCompleted'), tasksDue: total('tasksDue') },
    previous: { published: prevPublished, tasksCompleted: prevCompleted },
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
