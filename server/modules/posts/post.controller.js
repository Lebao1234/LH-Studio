import { sendCreated, sendSuccess } from '../../shared/utils/response.js';
import * as service from './post.service.js';

export async function list(req, res) {
  const { items, meta } = await service.findPosts(req.ctx, req.valid.query);
  sendSuccess(res, { data: items, meta });
}

export async function calendar(req, res) {
  sendSuccess(res, { data: await service.calendar(req.ctx, req.valid.query) });
}

export async function create(req, res) {
  sendCreated(res, await service.createPost(req.ctx, req.valid.body), 'Đã tạo bài viết.');
}

export async function get(req, res) {
  sendSuccess(res, { data: await service.getPost(req.ctx, req.valid.params.id) });
}

export async function update(req, res) {
  sendSuccess(res, { message: 'Đã cập nhật bài viết.', data: await service.updatePost(req.ctx, req.valid.params.id, req.valid.body) });
}

export async function remove(req, res) {
  await service.deletePost(req.ctx, req.valid.params.id);
  sendSuccess(res, { message: 'Đã xóa bài viết.' });
}

export async function listMetrics(req, res) {
  sendSuccess(res, { data: await service.listMetrics(req.ctx, req.valid.params.id) });
}

export async function addMetric(req, res) {
  sendCreated(res, await service.addMetric(req.ctx, req.valid.params.id, req.valid.body), 'Đã ghi nhận số liệu.');
}
