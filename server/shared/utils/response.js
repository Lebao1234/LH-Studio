export function sendSuccess(res, { data = null, message = 'Thành công.', meta, status = 200 } = {}) {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

export const sendCreated = (res, data, message = 'Tạo mới thành công.') =>
  sendSuccess(res, { data, message, status: 201 });
