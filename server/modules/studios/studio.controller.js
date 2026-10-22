import { sendCreated, sendSuccess } from '../../shared/utils/response.js';
import * as service from './studio.service.js';

export async function getCurrent(req, res) {
  sendSuccess(res, { data: await service.getCurrentStudio(req.ctx) });
}

export async function updateCurrent(req, res) {
  sendSuccess(res, { message: 'Đã cập nhật studio.', data: await service.updateCurrentStudio(req.ctx, req.valid.body) });
}

export async function listMembers(req, res) {
  sendSuccess(res, { data: await service.listMembers(req.ctx, req.valid.query) });
}

export async function addMember(req, res) {
  const result = await service.addMember(req.ctx, req.valid.body);
  if (result.type === 'invitation') {
    return sendSuccess(res, { status: 201, message: 'Đã tạo lời mời. Gửi đường dẫn cho người được mời.', data: result });
  }
  return sendCreated(res, result, 'Đã thêm thành viên vào studio.');
}

export async function updateMember(req, res) {
  sendSuccess(res, { message: 'Đã cập nhật thành viên.', data: await service.updateMember(req.ctx, req.valid.params.id, req.valid.body) });
}

export async function removeMember(req, res) {
  const result = await service.removeMember(req.ctx, req.valid.params.id);
  const message = result.status === 'rejected' ? 'Đã từ chối yêu cầu gia nhập.' : 'Đã vô hiệu hóa thành viên.';
  sendSuccess(res, { message, data: result });
}

export async function listInvitations(req, res) {
  sendSuccess(res, { data: await service.listInvitations(req.ctx) });
}

export async function revokeInvitation(req, res) {
  await service.revokeInvitation(req.ctx, req.valid.params.id);
  sendSuccess(res, { message: 'Đã thu hồi lời mời.' });
}
