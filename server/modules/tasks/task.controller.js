import { sendCreated, sendSuccess } from '../../shared/utils/response.js';
import * as service from './task.service.js';

export async function list(req, res) {
  const { items, meta } = await service.listTasks(req.ctx, req.valid.query);
  sendSuccess(res, { data: items, meta });
}

export async function create(req, res) {
  sendCreated(res, await service.createTask(req.ctx, req.valid.body), 'Đã tạo công việc.');
}

export async function get(req, res) {
  sendSuccess(res, { data: await service.getTask(req.ctx, req.valid.params.id) });
}

export async function update(req, res) {
  sendSuccess(res, { message: 'Đã cập nhật công việc.', data: await service.updateTask(req.ctx, req.valid.params.id, req.valid.body) });
}

export async function remove(req, res) {
  await service.deleteTask(req.ctx, req.valid.params.id);
  sendSuccess(res, { message: 'Đã xóa công việc.' });
}

export async function listAssignments(req, res) {
  sendSuccess(res, { data: await service.listAssignments(req.ctx, req.valid.params.id) });
}

export async function addAssignment(req, res) {
  sendCreated(res, await service.addAssignment(req.ctx, req.valid.params.id, req.valid.body), 'Đã giao công việc.');
}

export async function updateAssignment(req, res) {
  const { id, userId } = req.valid.params;
  sendSuccess(res, { message: 'Đã cập nhật vai trò.', data: await service.updateAssignment(req.ctx, id, userId, req.valid.body) });
}

export async function removeAssignment(req, res) {
  const { id, userId } = req.valid.params;
  sendSuccess(res, { message: 'Đã bỏ giao công việc.', data: await service.removeAssignment(req.ctx, id, userId) });
}
