import { verifyAccessToken } from '../modules/auth/tokens.js';
import { AuthSession } from '../modules/auth/authSession.model.js';
import { User } from '../modules/users/user.model.js';
import { unauthorized } from '../shared/errors/AppError.js';
import { MSG } from '../shared/constants/messages.js';

/**
 * Verifies the Bearer access token, then confirms the backing session is still
 * live and the user still active, so logout / suspension take effect immediately.
 */
export async function authenticate(req, _res, next) {
  const header = req.get('Authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next(unauthorized(MSG.TOKEN_MISSING, 'TOKEN_MISSING'));

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    const code = err?.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID';
    return next(unauthorized(MSG.TOKEN_INVALID, code));
  }

  const [session, user] = await Promise.all([
    AuthSession.findOne({ _id: payload.sid, userId: payload.sub, revokedAt: null, expiresAt: { $gt: new Date() } })
      .select('_id')
      .lean(),
    User.findById(payload.sub).select('name email avatarUrl phone status lastLoginAt').lean(),
  ]);

  if (!session) return next(unauthorized('Phiên đăng nhập đã kết thúc.', 'SESSION_REVOKED'));
  if (!user || user.status !== 'active') return next(unauthorized(MSG.ACCOUNT_SUSPENDED, 'ACCOUNT_INACTIVE'));

  req.auth = { userId: String(user._id), sessionId: String(session._id) };
  req.user = user;
  return next();
}
