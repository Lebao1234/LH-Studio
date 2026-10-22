import { sendCreated, sendSuccess } from '../../shared/utils/response.js';
import * as service from './project.service.js';

export async function list(req, res) {
  const { items, meta } = await service.listProjects(req.ctx, req.valid.query);
  sendSuccess(res, { data: items, meta });
}

export async function nextCode(req, res) {
  sendSuccess(res, { data: await service.getNextProjectCode(req.ctx, req.valid.query) });
}

export async function create(req, res) {
  sendCreated(res, await service.createProject(req.ctx, req.valid.body), 'Đã tạo dự án.');
}

export async function get(req, res) {
  sendSuccess(res, { data: await service.getProject(req.ctx, req.valid.params.id) });
}

export async function update(req, res) {
  sendSuccess(res, { message: 'Đã cập nhật dự án.', data: await service.updateProject(req.ctx, req.valid.params.id, req.valid.body) });
}

export async function remove(req, res) {
  await service.deleteProject(req.ctx, req.valid.params.id);
  sendSuccess(res, { message: 'Đã xóa dự án.' });
}

export async function listMembers(req, res) {
  sendSuccess(res, { data: await service.listMembers(req.ctx, req.valid.params.id) });
}

export async function addMember(req, res) {
  sendCreated(res, await service.addMember(req.ctx, req.valid.params.id, req.valid.body), 'Đã thêm thành viên dự án.');
}

export async function removeMember(req, res) {
  await service.removeMember(req.ctx, req.valid.params.id, req.valid.params.userId);
  sendSuccess(res, { message: 'Đã xóa thành viên khỏi dự án.' });
}
