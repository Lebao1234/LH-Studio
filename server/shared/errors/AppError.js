export class AppError extends Error {
  constructor(status, code, message, errors = undefined) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.expose = true;
  }
}

export const badRequest = (message = 'Yêu cầu không hợp lệ.', code = 'BAD_REQUEST', errors) =>
  new AppError(400, code, message, errors);

export const unauthorized = (message = 'Chưa xác thực.', code = 'UNAUTHORIZED') =>
  new AppError(401, code, message);

export const forbidden = (message = 'Bạn không có quyền thực hiện thao tác này.', code = 'FORBIDDEN') =>
  new AppError(403, code, message);

export const notFound = (message = 'Không tìm thấy tài nguyên.', code = 'NOT_FOUND') =>
  new AppError(404, code, message);

export const conflict = (message = 'Dữ liệu bị xung đột.', code = 'CONFLICT', errors) =>
  new AppError(409, code, message, errors);

/** Request is well-formed but violates a business rule. */
export const unprocessable = (message, code = 'BUSINESS_RULE_VIOLATION', errors) =>
  new AppError(422, code, message, errors);
