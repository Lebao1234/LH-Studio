import mongoose from 'mongoose';
import { withTransaction } from '../../shared/db/transaction.js';
import { conflict, forbidden, notFound, unprocessable } from '../../shared/errors/AppError.js';
import { buildSort, paginationMeta, toSkip } from '../../shared/utils/pagination.js';
import { compact, escapeRegex } from '../../shared/utils/validators.js';
import { TASK_OPEN_STATUS } from '../../shared/constants/enums.js';
import { USER_PUBLIC_FIELDS } from '../users/user.model.js';
import { StudioMember } from '../studios/studioMember.model.js';
import { Episode } from '../episodes/episode.model.js';
import { Task } from '../tasks/task.model.js';
import { TaskAssignment } from '../tasks/taskAssignment.model.js';
import { Post } from '../posts/post.model.js';
import { Transaction } from '../finances/transaction.model.js';
import { Project } from './project.model.js';
import { ProjectMember } from './projectMember.model.js';
import { isStudioManager, loadProjectWithAccess, projectScopeFilter } from './project.access.js';

const SORTABLE = ['title', 'code', 'dueDate', 'startDate', 'createdAt', 'updatedAt', 'status'];

async function statsFor(projectIds) {
  const ids = projectIds.map((id) => new mongoose.Types.ObjectId(String(id)));
  const [episodes, tasks, members] = await Promise.all([
    Episode.aggregate([
      { $match: { projectId: { $in: ids } } },
      {
        $group: {
          _id: '$projectId',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        },
      },
    ]),
    Task.aggregate([
      { $match: { projectId: { $in: ids } } },
      {
        $group: {
          _id: '$projectId',
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $in: ['$status', TASK_OPEN_STATUS] }, 1, 0] } },
          done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
        },
      },
    ]),
    ProjectMember.find({ projectId: { $in: ids } })
      .populate({ path: 'userId', select: USER_PUBLIC_FIELDS })
      .sort({ joinedAt: 1 })
      .lean(),
  ]);

  const map = new Map(ids.map((id) => [String(id), { episodes: { total: 0, completed: 0 }, tasks: { total: 0, open: 0, done: 0 }, members: [] }]));
  for (const e of episodes) Object.assign(map.get(String(e._id)).episodes, { total: e.total, completed: e.completed });
  for (const t of tasks) Object.assign(map.get(String(t._id)).tasks, { total: t.total, open: t.open, done: t.done });
  for (const m of members) {
    if (m.userId) map.get(String(m.projectId)).members.push({ role: m.role, user: m.userId });
  }
  return map;
}

export async function listProjects(ctx, q) {
  const filter = { studioId: ctx.studioId, ...(await projectScopeFilter(ctx, '_id')) };
  if (q.status) filter.status = { $in: q.status };
  if (q.category) filter.category = q.category;
  if (q.priority) filter.priority = q.priority;
  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), 'i');
    filter.$or = [{ title: rx }, { code: rx }];
  }

  const [items, total] = await Promise.all([
    Project.find(filter).sort(buildSort(q.sort, SORTABLE, '-updatedAt')).skip(toSkip(q)).limit(q.limit).lean(),
    Project.countDocuments(filter),
  ]);
  const stats = await statsFor(items.map((p) => p._id));
  return {
    items: items.map((p) => ({ ...p, id: String(p._id), ...stats.get(String(p._id)) })),
    meta: paginationMeta(q, total),
  };
}

export async function getProject(ctx, projectId) {
  const { project, projectRole } = await loadProjectWithAccess(ctx, projectId);
  const stats = (await statsFor([project._id])).get(String(project._id));
  return { ...project.toJSON(), ...stats, myProjectRole: projectRole };
}

function applyCompletion(target, status) {
  if (!status) return;
  if (status === 'completed' && !target.completedAt) target.completedAt = new Date();
  if (status !== 'completed') target.completedAt = null;
}

export async function getNextProjectCode(ctx, { category = 'KID' } = {}) {
  const prefix = String(category || 'KID').trim().toUpperCase() || 'GEN';
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const dateTag = `${day}${month}`; // e.g. "1810" for October 18

  const pattern = new RegExp(`^${prefix}-${dateTag}(\\d+)$`);
  const projects = await Project.find({
    studioId: ctx.studioId,
    code: new RegExp(`^${prefix}-${dateTag}`),
  })
    .select('code')
    .lean();

  let maxSeq = 0;
  for (const p of projects) {
    const match = p.code.match(pattern);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  const code = `${prefix}-${dateTag}${nextSeq}`;
  return { code, prefix, dateTag, sequence: maxSeq + 1 };
}

export async function createProject(ctx, input) {
  if (ctx.role === 'viewer') throw forbidden('Tài khoản chỉ có quyền xem.', 'READ_ONLY');
  const doc = { ...compact(input), studioId: ctx.studioId, createdBy: ctx.userId };
  if (!doc.code) {
    const generated = await getNextProjectCode(ctx, { category: doc.category || 'KID' });
    doc.code = generated.code;
  }
  if (!doc.category && doc.code.includes('-')) {
    doc.category = doc.code.split('-')[0];
  }
  applyCompletion(doc, doc.status);
  return withTransaction(async (session) => {
    const [project] = await Project.create([doc], { session });
    // The creator manages the project they created.
    await ProjectMember.create([{ projectId: project._id, userId: ctx.userId, role: 'manager' }], { session });
    return project;
  });
}

export async function updateProject(ctx, projectId, input) {
  const { project } = await loadProjectWithAccess(ctx, projectId, { write: true, roles: ['manager'] });
  const changes = compact(input);
  applyCompletion(changes, changes.status);

  const startDate = changes.startDate !== undefined ? changes.startDate : project.startDate;
  const dueDate = changes.dueDate !== undefined ? changes.dueDate : project.dueDate;
  if (startDate && dueDate && dueDate < startDate) {
    throw unprocessable('Hạn chót phải sau ngày bắt đầu.', 'INVALID_DATE_RANGE');
  }

  project.set(changes);
  await project.save();
  return project;
}

export async function deleteProject(ctx, projectId) {
  if (!isStudioManager(ctx)) throw forbidden('Chỉ chủ sở hữu hoặc quản trị viên được xóa dự án.');
  const { project } = await loadProjectWithAccess(ctx, projectId, { write: true });

  if (await Transaction.exists({ studioId: ctx.studioId, projectId: project._id })) {
    throw conflict('Dự án đã có giao dịch tài chính. Hãy chuyển trạng thái "Hủy" thay vì xóa.', 'PROJECT_HAS_FINANCE');
  }

  await withTransaction(async (session) => {
    const taskIds = await Task.find({ projectId: project._id }).distinct('_id').session(session);
    await TaskAssignment.deleteMany({ taskId: { $in: taskIds } }, { session });
    await Task.deleteMany({ projectId: project._id }, { session });
    await Episode.deleteMany({ projectId: project._id }, { session });
    await ProjectMember.deleteMany({ projectId: project._id }, { session });
    // Posts survive independently of projects.
    await Post.updateMany({ projectId: project._id }, { $set: { projectId: null, episodeId: null } }, { session });
    await Project.deleteOne({ _id: project._id }, { session });
  });
}

export async function listMembers(ctx, projectId) {
  const { project } = await loadProjectWithAccess(ctx, projectId);
  const members = await ProjectMember.find({ projectId: project._id })
    .populate({ path: 'userId', select: USER_PUBLIC_FIELDS })
    .sort({ joinedAt: 1 })
    .lean();
  return members.map(({ userId, ...m }) => ({ ...m, user: userId, userId: userId?._id }));
}

export async function addMember(ctx, projectId, { userId, role }) {
  const { project } = await loadProjectWithAccess(ctx, projectId, { write: true, roles: ['manager'] });
  const studioMember = await StudioMember.findOne({ studioId: ctx.studioId, userId, status: 'active' }).lean();
  if (!studioMember) throw unprocessable('Người dùng không phải thành viên đang hoạt động của studio.', 'NOT_STUDIO_MEMBER');

  const member = await ProjectMember.findOneAndUpdate(
    { projectId: project._id, userId },
    { $set: { role }, $setOnInsert: { joinedAt: new Date() } },
    { upsert: true, returnDocument: 'after', runValidators: true },
  );
  return member;
}

export async function removeMember(ctx, projectId, userId) {
  const { project } = await loadProjectWithAccess(ctx, projectId, { write: true, roles: ['manager'] });
  const member = await ProjectMember.findOne({ projectId: project._id, userId });
  if (!member) throw notFound('Thành viên không thuộc dự án.');

  if (member.role === 'manager') {
    const managers = await ProjectMember.countDocuments({ projectId: project._id, role: 'manager' });
    if (managers <= 1 && !isStudioManager(ctx)) {
      throw conflict('Dự án cần ít nhất một quản lý.', 'LAST_PROJECT_MANAGER');
    }
  }
  await member.deleteOne();
}
