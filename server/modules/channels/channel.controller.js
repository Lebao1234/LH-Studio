import { sendCreated, sendSuccess } from '../../shared/utils/response.js';
import * as service from './channel.service.js';

export async function list(req, res) {
  sendSuccess(res, { data: await service.listChannels(req.ctx, req.valid.query) });
}

export async function create(req, res) {
  sendCreated(res, await service.createChannel(req.ctx, req.valid.body), 'Đã thêm kênh.');
}

export async function get(req, res) {
  sendSuccess(res, { data: await service.getChannelOrThrow(req.ctx, req.valid.params.id) });
}

export async function update(req, res) {
  sendSuccess(res, { message: 'Đã cập nhật kênh.', data: await service.updateChannel(req.ctx, req.valid.params.id, req.valid.body) });
}

export async function remove(req, res) {
  await service.deleteChannel(req.ctx, req.valid.params.id);
  sendSuccess(res, { message: 'Đã xóa kênh.' });
}
