import { sendCreated, sendSuccess } from '../../shared/utils/response.js';
import * as service from './episode.service.js';

export async function listForProject(req, res) {
  const { items, meta } = await service.listEpisodes(req.ctx, req.valid.params.projectId, req.valid.query);
  sendSuccess(res, { data: items, meta });
}

export async function createForProject(req, res) {
  sendCreated(res, await service.createEpisode(req.ctx, req.valid.params.projectId, req.valid.body), 'Đã tạo tập phim.');
}

export async function get(req, res) {
  sendSuccess(res, { data: await service.getEpisode(req.ctx, req.valid.params.id) });
}

export async function update(req, res) {
  sendSuccess(res, { message: 'Đã cập nhật tập phim.', data: await service.updateEpisode(req.ctx, req.valid.params.id, req.valid.body) });
}

export async function remove(req, res) {
  await service.deleteEpisode(req.ctx, req.valid.params.id);
  sendSuccess(res, { message: 'Đã xóa tập phim.' });
}
