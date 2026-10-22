import mongoose from 'mongoose';
import { STUDIO_MANAGER_ROLES } from '../../shared/constants/enums.js';
import { forbidden, notFound, unprocessable } from '../../shared/errors/AppError.js';
import { StudioMember } from '../studios/studioMember.model.js';
import { Project } from './project.model.js';
import { ProjectMember } from './projectMember.model.js';

/*
 * Access model
 * ------------
 * - owner/admin ("studio managers") can see and change every project in the studio.
 * - member/viewer only see projects they were added to (project_members).
 * - viewer is always read-only.
 * - Project-level write: any project role (member+) for tasks, manager/editor/creator
 *   for episodes, manager for project settings and membership.
 */

export const isStudioManager = (ctx) => STUDIO_MANAGER_ROLES.includes(ctx.role);
export const isViewer = (ctx) => ctx.role === 'viewer';

/** null means "all projects in the studio". */
export async function accessibleProjectIds(ctx) {
  if (isStudioManager(ctx)) return null;
  const memberships = await ProjectMember.find({ userId: ctx.userId }).select('projectId').lean();
  const ids = memberships.map((m) => m.projectId);
  if (!ids.length) return [];
  const projects = await Project.find({ _id: { $in: ids }, studioId: ctx.studioId }).select('_id').lean();
  return projects.map((p) => p._id);
}

/** Mongo filter fragment restricting `field` to accessible projects. */
export async function projectScopeFilter(ctx, field = 'projectId') {
  const ids = await accessibleProjectIds(ctx);
  return ids === null ? {} : { [field]: { $in: ids } };
}

/**
 * Loads a project of the current studio and checks the caller's access.
 * Projects of other studios (or invisible ones) yield 404 to avoid leaking existence.
 *
 * @param {object} opts
 * @param {boolean} [opts.write]   caller must be allowed to modify project content
 * @param {string[]} [opts.roles]  project roles allowed for this write (managers always pass)
 */
export async function loadProjectWithAccess(ctx, projectId, { write = false, roles } = {}) {
  if (!mongoose.isValidObjectId(projectId)) throw notFound('Không tìm thấy dự án.');
  const project = await Project.findOne({ _id: projectId, studioId: ctx.studioId });
  if (!project) throw notFound('Không tìm thấy dự án.');

  if (isStudioManager(ctx)) return { project, projectRole: 'manager', isManager: true };

  const membership = await ProjectMember.findOne({ projectId: project._id, userId: ctx.userId }).lean();
  if (!membership) throw notFound('Không tìm thấy dự án.');

  if (write) {
    if (isViewer(ctx)) throw forbidden('Tài khoản chỉ có quyền xem.', 'READ_ONLY');
    if (roles && !roles.includes(membership.role)) throw forbidden();
  }
  return { project, projectRole: membership.role, isManager: false };
}

/**
 * A user may be assigned to work in a project only if they are an active,
 * non-viewer studio member AND (a project member OR a studio manager).
 */
export async function assertAssignable(ctx, projectId, userId) {
  if (!mongoose.isValidObjectId(userId)) throw unprocessable('Người được giao không hợp lệ.', 'INVALID_ASSIGNEE');
  const membership = await StudioMember.findOne({ studioId: ctx.studioId, userId, status: 'active' }).lean();
  if (!membership || membership.role === 'viewer') {
    throw unprocessable('Người được giao không thuộc studio hoặc không có quyền làm việc.', 'INVALID_ASSIGNEE');
  }
  if (STUDIO_MANAGER_ROLES.includes(membership.role)) return;
  const inProject = await ProjectMember.exists({ projectId, userId });
  if (!inProject) throw unprocessable('Người được giao chưa là thành viên dự án.', 'INVALID_ASSIGNEE');
}
