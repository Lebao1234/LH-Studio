import { sendCreated, sendSuccess } from '../../shared/utils/response.js';
import * as service from './finance.service.js';

export async function listCategories(req, res) {
  sendSuccess(res, { data: await service.listCategories(req.ctx, req.valid.query) });
}

export async function createCategory(req, res) {
  sendCreated(res, await service.createCategory(req.ctx, req.valid.body), 'Đã tạo danh mục.');
}

export async function updateCategory(req, res) {
  sendSuccess(res, { message: 'Đã cập nhật danh mục.', data: await service.updateCategory(req.ctx, req.valid.params.id, req.valid.body) });
}

export async function listTransactions(req, res) {
  const { items, meta } = await service.listTransactions(req.ctx, req.valid.query);
  sendSuccess(res, { data: items, meta });
}

export async function exportTransactions(req, res) {
  const csv = await service.exportTransactionsCsv(req.ctx, req.valid.query);
  const stamp = new Date().toISOString().slice(0, 10);
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', `attachment; filename="so-thu-chi-${stamp}.csv"`);
  res.set('Cache-Control', 'no-store');
  res.send(csv);
}

export async function createTransaction(req, res) {
  sendCreated(res, await service.createTransaction(req.ctx, req.valid.body), 'Đã tạo giao dịch.');
}

export async function getTransaction(req, res) {
  sendSuccess(res, { data: await service.getTransaction(req.ctx, req.valid.params.id) });
}

export async function updateTransaction(req, res) {
  sendSuccess(res, { message: 'Đã cập nhật giao dịch.', data: await service.updateTransaction(req.ctx, req.valid.params.id, req.valid.body) });
}

export async function deleteTransaction(req, res) {
  await service.deleteTransaction(req.ctx, req.valid.params.id);
  sendSuccess(res, { message: 'Đã xóa giao dịch.' });
}

export async function listPayments(req, res) {
  sendSuccess(res, { data: await service.listPayments(req.ctx, req.valid.params.id) });
}

export async function createPayment(req, res) {
  const body = { ...req.valid.body };
  // The Idempotency-Key header is accepted as an alternative to the body field.
  const headerKey = req.get('Idempotency-Key');
  if (!body.idempotencyKey && headerKey && /^[A-Za-z0-9_-]{8,100}$/.test(headerKey)) body.idempotencyKey = headerKey;
  sendCreated(res, await service.recordPayment(req.ctx, req.valid.params.id, body), 'Đã ghi nhận thanh toán.');
}

export async function reversePayment(req, res) {
  const { id, paymentId } = req.valid.params;
  sendCreated(res, await service.reversePayment(req.ctx, id, paymentId, req.valid.body), 'Đã ghi bút toán điều chỉnh.');
}

export async function summary(req, res) {
  sendSuccess(res, { data: await service.getSummary(req.ctx, req.valid.query) });
}

export async function expensesByCategory(req, res) {
  sendSuccess(res, { data: await service.expensesByCategory(req.ctx, req.valid.query) });
}
