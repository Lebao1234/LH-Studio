import mongoose from 'mongoose';
import { withTransaction } from '../../shared/db/transaction.js';
import { TASK_OPEN_STATUS } from '../../shared/constants/enums.js';
import { conflict, forbidden, notFound, unprocessable } from '../../shared/errors/AppError.js';
import { buildSort, paginationMeta, toSkip } from '../../shared/utils/pagination.js';
import { compact, escapeRegex } from '../../shared/utils/validators.js';
import { USER_PUBLIC_FIELDS } from '../users/user.model.js';
import { Episode } from '../episodes/episode.model.js';
import { ProjectMember } from '../projects/projectMember.model.js';
import { accessibleProjectIds, assertAssignable, isStudioManager, loadProjectWithAccess } from '../projects/project.access.js';
import { Task } from './task.model.js';
import { TaskAssignment } from './taskAssignment.model.js';

const SORTABLE = ['title', 'dueDate', 'priority', 'status', 'createdAt', 'updatedAt'];

const isOverdue = (t) => Boolean(t.dueDate) && new Date(t.dueDate) < new Date() && TASK_OPEN_STATUS.includes(t.status);

function applyCompletion(target, status) {
  if (!status) return;
  if (status === 'done' && !target.completedAt) target.completedAt = new Date();
  if (status !== 'done') target.completedAt = null;
}

async function assertEpisodeInProject(episodeId, projectId) {
  if (!episodeId) return;
  const ok = await Episode.exists({ _id: episodeId, projectId });
  if (!ok) throw unprocessable('Tập phim không thuộc dự án của công việc.', 'EPISODE_PROJECT_MISMATCH');
}

/** Converts duplicate-key races on task_assignments into readable conflicts. */
function rethrowAssignmentConflict(err) {
  if (err?.code === 11000) {
    const keys = Object.keys(err.keyPattern || {});
    if (keys.includes('userId')) throw conflict('Người này đã được giao công việc.', 'ALREADY_ASSIGNED');
    throw conflict('Công việc đã có người phụ trách chính.', 'LEAD_EXISTS');
  }
  throw err;
}

async function attachAssignments(tasks) {
  const ids = tasks.map((t) => t._id);
  const assignments = await TaskAssignment.find({ taskId: { $in: ids } })
    .populate({ path: 'userId', select: USER_PUBLIC_FIELDS })
    .sort({ role: -1, assignedAt: 1 })
    .lean();
  const byTask = new Map();
  for (const a of assignments) {
    if (!a.userId) continue;
    const list = byTask.get(String(a.taskId)) ?? [];
    list.push({ _id: a._id, role: a.role, assignedAt: a.assignedAt, user: a.userId, userId: a.userId._id });
    byTask.set(String(a.taskId), list);
  }
  return tasks.map((t) => ({ ...t, id: String(t._id), assignments: byTask.get(String(t._id)) ?? [], isOverdue: isOverdue(t) }));
}

/** Loads a task of the current studio with the caller's effective permissions. */
async function loadTask(ctx, taskId) {
  if (!mongoose.isValidObjectId(taskId)) throw notFound('Không tìm thấy công việc.');
  const task = await Task.findOne({ _id: taskId, studioId: ctx.studioId });
  if (!task) throw notFound('Không tìm thấy công việc.');

  const isAssignee = Boolean(await TaskAssignment.exists({ taskId: task._id, userId: ctx.userId }));
  if (isStudioManager(ctx)) return { task, canEdit: true, canManage: true, isAssignee };

  const membership = await ProjectMember.findOne({ projectId: task.projectId, userId: ctx.userId }).lean();
  if (!membership && !isAssignee) throw notFound('Không tìm thấy công việc.');

  const writable = ctx.role !== 'viewer';
  return {
    task,
    isAssignee,
    canEdit: writable && (Boolean(membership) || isAssignee),
    // Structural changes (assignments, deletion) require project membership.
    canManage: writable && Boolean(membership),
    projectRole: membership?.role,
  };
}

export async function listTasks(ctx, q) {
  const and = [{ studioId: new mongoose.Types.ObjectId(ctx.studioId) }];

  const accessible = await accessibleProjectIds(ctx);
  if (accessible !== null) {
    const assigned = await TaskAssignment.distinct('taskId', { userId: ctx.userId });
    and.push({ $or: [{ projectId: { $in: accessible } }, { _id: { $in: assigned } }] });
  }

  const assigneeId = q.mine || q.assignee === 'me' ? ctx.userId : q.assignee;
  if (assigneeId) {
    const ids = await TaskAssignment.distinct('taskId', { userId: assigneeId });
    and.push({ _id: { $in: ids } });
  }

  if (q.projectId) and.push({ projectId: new mongoose.Types.ObjectId(q.projectId) });
  if (q.episodeId) and.push({ episodeId: new mongoose.Types.ObjectId(q.episodeId) });
  if (q.status) and.push({ status: { $in: q.status } });
  if (q.priority) and.push({ priority: { $in: q.priority } });
  if (q.type) and.push({ type: q.type });
  if (q.search) and.push({ title: new RegExp(escapeRegex(q.search), 'i') });
  if (q.overdue) and.push({ dueDate: { $lt: new Date() }, status: { $in: TASK_OPEN_STATUS } });
  if (q.dueFrom || q.dueTo) {
    and.push({ dueDate: { ...(q.dueFrom ? { $gte: q.dueFrom } : {}), ...(q.dueTo ? { $lte: q.dueTo } : {}) } });
  }

  const filter = { $and: and };
  const [items, total] = await Promise.all([
    Task.find(filter)
      .populate({ path: 'projectId', select: 'code title' })
      .populate({ path: 'episodeId', select: 'episodeNumber title' })
      .sort(buildSort(q.sort, SORTABLE, '-updatedAt'))
      .skip(toSkip(q))
      .limit(q.limit)
      .lean(),
    Task.countDocuments(filter),
  ]);

  const shaped = items.map(({ projectId, episodeId, ...t }) => ({
    ...t,
    projectId: projectId?._id ?? projectId,
    project: projectId,
    episodeId: episodeId?._id ?? episodeId ?? null,
    episode: episodeId ?? null,
  }));
  return { items: await attachAssignments(shaped), meta: paginationMeta(q, total) };
}

export async function getTask(ctx, taskId) {
  const { task, canEdit, canManage } = await loadTask(ctx, taskId);
  await task.populate([
    { path: 'projectId', select: 'code title' },
    { path: 'episodeId', select: 'episodeNumber title' },
    { path: 'createdBy', select: USER_PUBLIC_FIELDS },
  ]);
  const obj = task.toJSON();
  const shaped = {
    ...obj,
    project: obj.projectId,
    projectId: obj.projectId?._id,
    episode: obj.episodeId ?? null,
    episodeId: obj.episodeId?._id ?? null,
    permissions: { canEdit, canManage },
  };
  const [withAssignments] = await attachAssignments([shaped]);
  return withAssignments;
}

export async function createTask(ctx, input) {
  const { project } = await loadProjectWithAccess(ctx, input.projectId, { write: true });
  await assertEpisodeInProject(input.episodeId, project._id);

  const assignees = input.assignees ?? [];
  for (const a of assignees) await assertAssignable(ctx, project._id, a.userId);

  const { assignees: _ignored, ...fields } = input;
  const doc = { ...compact(fields), studioId: ctx.studioId, projectId: project._id, createdBy: ctx.userId };
  applyCompletion(doc, doc.status);

  const task = await withTransaction(async (session) => {
    const [created] = await Task.create([doc], { session });
    if (assignees.length) {
      await TaskAssignment.insertMany(
        assignees.map((a) => ({ taskId: created._id, userId: a.userId, role: a.role, assignedBy: ctx.userId })),
        { session, ordered: true },
      ).catch(rethrowAssignmentConflict);
    }
    return created;
  });
  return getTask(ctx, task._id);
}

export async function updateTask(ctx, taskId, input) {
  const { task, canEdit } = await loadTask(ctx, taskId);
  if (!canEdit) throw forbidden();

  const changes = compact(input);
  if (changes.episodeId) await assertEpisodeInProject(changes.episodeId, task.projectId);

  const startDate = changes.startDate !== undefined ? changes.startDate : task.startDate;
  const dueDate = changes.dueDate !== undefined ? changes.dueDate : task.dueDate;
  if (startDate && dueDate && dueDate < startDate) throw unprocessable('Hạn chót phải sau ngày bắt đầu.', 'INVALID_DATE_RANGE');

  applyCompletion(changes, changes.status);
  task.set(changes);
  await task.save();
  return getTask(ctx, task._id);
}

export async function deleteTask(ctx, taskId) {
  const { task, canManage, projectRole } = await loadTask(ctx, taskId);
  const allowed =
    isStudioManager(ctx) || (canManage && (projectRole === 'manager' || String(task.createdBy) === ctx.userId));
  if (!allowed) throw forbidden('Chỉ người tạo, quản lý dự án hoặc quản trị viên được xóa công việc.');

  await withTransaction(async (session) => {
    await TaskAssignment.deleteMany({ taskId: task._id }, { session });
    await Task.deleteOne({ _id: task._id }, { session });
  });
}

export async function listAssignments(ctx, taskId) {
  const { task } = await loadTask(ctx, taskId);
  const [withAssignments] = await attachAssignments([{ _id: task._id }]);
  return withAssignments.assignments;
}

export async function addAssignment(ctx, taskId, { userId, role }) {
  const { task, canManage } = await loadTask(ctx, taskId);
  if (!canManage) throw forbidden();
  await assertAssignable(ctx, task.projectId, userId);

  if (await TaskAssignment.exists({ taskId: task._id, userId })) {
    throw conflict('Người này đã được giao công việc.', 'ALREADY_ASSIGNED');
  }
  if (role === 'lead' && (await TaskAssignment.exists({ taskId: task._id, role: 'lead' }))) {
    throw conflict('Công việc đã có người phụ trách chính.', 'LEAD_EXISTS');
  }
  // The unique indexes remain the final guard under concurrent requests.
  await TaskAssignment.create({ taskId: task._id, userId, role, assignedBy: ctx.userId }).catch(rethrowAssignmentConflict);
  return listAssignments(ctx, taskId);
}

export async function updateAssignment(ctx, taskId, userId, { role }) {
  const { task, canManage } = await loadTask(ctx, taskId);
  if (!canManage) throw forbidden();
  const assignment = await TaskAssignment.findOne({ taskId: task._id, userId });
  if (!assignment) throw notFound('Người này chưa được giao công việc.');

  if (role === 'lead' && assignment.role !== 'lead') {
    if (await TaskAssignment.exists({ taskId: task._id, role: 'lead' })) {
      throw conflict('Công việc đã có người phụ trách chính.', 'LEAD_EXISTS');
    }
  }
  assignment.role = role;
  await assignment.save().catch(rethrowAssignmentConflict);
  return listAssignments(ctx, taskId);
}

export async function removeAssignment(ctx, taskId, userId) {
  const { task, canManage } = await loadTask(ctx, taskId);
  if (!canManage) throw forbidden();
  const result = await TaskAssignment.deleteOne({ taskId: task._id, userId });
  if (!result.deletedCount) throw notFound('Người này chưa được giao công việc.');
  return listAssignments(ctx, taskId);
}
