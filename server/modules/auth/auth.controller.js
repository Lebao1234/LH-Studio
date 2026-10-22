import { sendSuccess } from '../../shared/utils/response.js';
import { MSG } from '../../shared/constants/messages.js';
import * as authService from './auth.service.js';
import { REFRESH_COOKIE, refreshCookieOptions } from './tokens.js';
import { env } from '../../config/env.js';

const requestMeta = (req) => ({ ip: req.ip, userAgent: req.get('User-Agent') });

function issueSession(res, result) {
  res.cookie(REFRESH_COOKIE, result.refreshToken, { ...refreshCookieOptions(), maxAge: env.refreshTtlMs });
  // The refresh token never appears in a response body.
  return {
    user: result.user,
    memberships: result.memberships,
    accessToken: result.accessToken,
    expiresIn: result.expiresIn,
  };
}

const clearRefreshCookie = (res) => res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());

export async function registrationStatus(_req, res) {
  sendSuccess(res, { data: await authService.getRegistrationStatus() });
}

export async function previewInvitation(req, res) {
  sendSuccess(res, { data: await authService.previewInvitation(req.valid.params.token) });
}

export async function register(req, res) {
  const result = await authService.register(req.valid.body, requestMeta(req));
  sendSuccess(res, { status: 201, message: MSG.REGISTER_SUCCESS, data: issueSession(res, result) });
}

export async function login(req, res) {
  const result = await authService.login(req.valid.body, requestMeta(req));
  sendSuccess(res, { message: MSG.LOGIN_SUCCESS, data: issueSession(res, result) });
}

export async function refresh(req, res) {
  try {
    const result = await authService.refresh(req.cookies?.[REFRESH_COOKIE], requestMeta(req));
    sendSuccess(res, { message: 'Đã làm mới phiên.', data: issueSession(res, result) });
  } catch (err) {
    // Keep the cookie during a benign multi-tab race; clear it on every other failure.
    if (err?.code !== 'REFRESH_ROTATED') clearRefreshCookie(res);
    throw err;
  }
}

export async function logout(req, res) {
  await authService.logout(req.cookies?.[REFRESH_COOKIE]);
  clearRefreshCookie(res);
  sendSuccess(res, { message: MSG.LOGOUT_SUCCESS });
}

export async function me(req, res) {
  sendSuccess(res, { data: await authService.getMe(req.auth.userId) });
}

export async function changePassword(req, res) {
  await authService.changePassword(req.auth.userId, req.auth.sessionId, req.valid.body);
  sendSuccess(res, { message: 'Đổi mật khẩu thành công. Các thiết bị khác đã bị đăng xuất.' });
}
