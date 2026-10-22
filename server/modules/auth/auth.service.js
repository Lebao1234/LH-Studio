import argon2 from 'argon2';
import { env } from '../../config/env.js';
import { withTransaction } from '../../shared/db/transaction.js';
import { AppError, conflict, forbidden, notFound, unauthorized } from '../../shared/errors/AppError.js';
import { MSG } from '../../shared/constants/messages.js';
import { slugify } from '../../shared/utils/slug.js';
import { User, toSafeUser } from '../users/user.model.js';
import { Studio } from '../studios/studio.model.js';
import { StudioMember } from '../studios/studioMember.model.js';
import { Invitation } from '../studios/invitation.model.js';
import { FinanceCategory } from '../finances/financeCategory.model.js';
import { DEFAULT_FINANCE_CATEGORIES } from '../finances/finance.defaults.js';
import { AuthSession } from './authSession.model.js';
import { hashToken, safeEqual, signAccessToken, signRefreshToken, verifyRefreshToken } from './tokens.js';

const ARGON_OPTIONS = { type: argon2.argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1 };

/** Grace window in which a just-rotated token is treated as a benign race, not reuse. */
const ROTATION_GRACE_MS = 20_000;

let dummyHashPromise;
const dummyHash = () => (dummyHashPromise ??= argon2.hash('lh-studio-timing-equaliser', ARGON_OPTIONS));

export const hashPassword = (plain) => argon2.hash(plain, ARGON_OPTIONS);

const invalidCredentials = () => unauthorized(MSG.LOGIN_WRONG, 'INVALID_CREDENTIALS');

async function createSession(userId, meta) {
  const session = new AuthSession({
    userId,
    tokenHash: 'pending',
    expiresAt: new Date(Date.now() + env.refreshTtlMs),
    userAgent: meta.userAgent?.slice(0, 300),
    ip: meta.ip?.slice(0, 64),
    lastUsedAt: new Date(),
  });
  const refreshToken = signRefreshToken({ userId, sessionId: String(session._id) });
  session.tokenHash = hashToken(refreshToken);
  await session.save();
  const accessToken = signAccessToken({ userId, sessionId: String(session._id) });
  return { accessToken, refreshToken, expiresIn: Math.floor(env.accessTtlMs / 1000) };
}

async function loadMemberships(userId) {
  const memberships = await StudioMember.find({ userId, status: { $in: ['active', 'pending'] } })
    .sort({ joinedAt: 1 })
    .populate({ path: 'studioId', select: 'name slug logoUrl timezone currency status initialOwnerId' })
    .lean();
  return memberships
    .filter((m) => m.studioId && m.studioId.status === 'active')
    .map((m) => ({
      studio: { ...m.studioId, id: String(m.studioId._id) },
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt,
    }));
}

export async function getRegistrationStatus() {
  const studioCount = await Studio.estimatedDocumentCount();
  return { bootstrapAvailable: Boolean(env.BOOTSTRAP_TOKEN) && studioCount === 0 };
}

async function findUsableInvitation(token, session) {
  const invitation = await Invitation.findOne({ tokenHash: hashToken(token) })
    .session(session ?? null)
    .populate({ path: 'studioId', select: 'name slug status' });
  if (
    !invitation ||
    invitation.acceptedAt ||
    invitation.revokedAt ||
    invitation.expiresAt < new Date() ||
    invitation.studioId?.status !== 'active'
  ) {
    throw new AppError(400, 'INVITATION_INVALID', 'Lời mời không hợp lệ hoặc đã hết hạn.');
  }
  return invitation;
}

export async function previewInvitation(token) {
  const inv = await findUsableInvitation(token);
  return { email: inv.email, name: inv.name, role: inv.role, studio: { name: inv.studioId.name }, expiresAt: inv.expiresAt };
}

export async function register(input, meta) {
  const passwordHash = await hashPassword(input.password);

  const user = await withTransaction(async (session) => {
    if (await User.exists({ email: input.email }).session(session)) {
      throw conflict(MSG.EMAIL_TAKEN, 'EMAIL_TAKEN');
    }

    if (input.bootstrapToken) {
      // Initial owner bootstrap: only while no studio exists, only with the server-side token.
      if (!env.BOOTSTRAP_TOKEN || !safeEqual(input.bootstrapToken, env.BOOTSTRAP_TOKEN)) {
        throw forbidden('Mã khởi tạo không hợp lệ.', 'BOOTSTRAP_INVALID');
      }
      if ((await Studio.countDocuments({}).session(session)) > 0) {
        throw forbidden('Studio đã được khởi tạo. Hãy dùng lời mời để đăng ký.', 'BOOTSTRAP_CLOSED');
      }
      const [created] = await User.create([{ name: input.name, email: input.email, passwordHash }], { session });
      const studioName = input.studioName || 'LH Studio';
      const [studio] = await Studio.create(
        [{ name: studioName, slug: slugify(studioName), initialOwnerId: created._id }],
        { session },
      );
      await StudioMember.create([{ studioId: studio._id, userId: created._id, role: 'owner' }], { session });
      await FinanceCategory.insertMany(
        DEFAULT_FINANCE_CATEGORIES.map((c) => ({ ...c, studioId: studio._id })),
        { session },
      );
      return created;
    }

    // Invitation-controlled registration: the role comes from the invitation, never from the client.
    if (input.inviteToken) {
      const invitation = await findUsableInvitation(input.inviteToken, session);
      if (invitation.email !== input.email) {
        throw new AppError(400, 'INVITATION_EMAIL_MISMATCH', 'Email không khớp với lời mời.');
      }
      const [created] = await User.create([{ name: input.name, email: input.email, passwordHash }], { session });
      await StudioMember.create(
        [{ studioId: invitation.studioId._id, userId: created._id, role: invitation.role }],
        { session },
      );
      const accepted = await Invitation.updateOne(
        { _id: invitation._id, acceptedAt: null, revokedAt: null },
        { $set: { acceptedAt: new Date(), acceptedUserId: created._id } },
        { session },
      );
      if (accepted.modifiedCount !== 1) throw new AppError(400, 'INVITATION_INVALID', 'Lời mời đã được sử dụng.');
      return created;
    }

    // Direct / Open registration (no invite token required):
    const [created] = await User.create([{ name: input.name, email: input.email, passwordHash }], { session });
    let studio = await Studio.findOne({ status: 'active' }).session(session);
    let role = 'member';
    let status = 'pending';

    if (!studio) {
      const studioName = input.studioName || `${input.name} Studio`;
      let slug = slugify(studioName);
      if (await Studio.exists({ slug }).session(session)) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }
      const [newStudio] = await Studio.create(
        [{ name: studioName, slug, initialOwnerId: created._id }],
        { session },
      );
      studio = newStudio;
      role = 'owner';
      status = 'active';
      await FinanceCategory.insertMany(
        DEFAULT_FINANCE_CATEGORIES.map((c) => ({ ...c, studioId: studio._id })),
        { session },
      );
    }

    await StudioMember.create(
      [{ studioId: studio._id, userId: created._id, role, status }],
      { session },
    );
    return created;
  });

  const tokens = await createSession(String(user._id), meta);
  return { user: toSafeUser(user), memberships: await loadMemberships(user._id), ...tokens };
}

export async function login({ email, password }, meta) {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    await argon2.verify(await dummyHash(), password).catch(() => false);
    throw invalidCredentials();
  }
  const ok = await argon2.verify(user.passwordHash, password).catch(() => false);
  if (!ok) throw invalidCredentials();
  if (user.status !== 'active') throw forbidden(MSG.ACCOUNT_SUSPENDED, 'ACCOUNT_SUSPENDED');

  if (argon2.needsRehash(user.passwordHash, ARGON_OPTIONS)) user.passwordHash = await hashPassword(password);
  user.lastLoginAt = new Date();
  await user.save();

  const tokens = await createSession(String(user._id), meta);
  return { user: toSafeUser(user), memberships: await loadMemberships(user._id), ...tokens };
}

export async function refresh(refreshToken, meta) {
  if (!refreshToken) throw unauthorized('Thiếu refresh token.', 'REFRESH_MISSING');

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw unauthorized('Refresh token không hợp lệ hoặc đã hết hạn.', 'REFRESH_INVALID');
  }

  const presentedHash = hashToken(refreshToken);
  const now = new Date();
  const nextToken = signRefreshToken({ userId: payload.sub, sessionId: payload.sid });

  // Atomic rotation: only succeeds if the presented token is the current one.
  const rotated = await AuthSession.findOneAndUpdate(
    { _id: payload.sid, userId: payload.sub, tokenHash: presentedHash, revokedAt: null, expiresAt: { $gt: now } },
    {
      $set: {
        tokenHash: hashToken(nextToken),
        previousTokenHash: presentedHash,
        rotatedAt: now,
        lastUsedAt: now,
        expiresAt: new Date(now.getTime() + env.refreshTtlMs),
        ...(meta.ip ? { ip: meta.ip.slice(0, 64) } : {}),
      },
    },
    { returnDocument: 'after' },
  );

  if (!rotated) {
    const session = await AuthSession.findOne({ _id: payload.sid, userId: payload.sub });
    if (session && !session.revokedAt) {
      const isRecentRace =
        session.previousTokenHash === presentedHash &&
        session.rotatedAt &&
        now.getTime() - session.rotatedAt.getTime() < ROTATION_GRACE_MS;
      if (isRecentRace) {
        // Another tab rotated a moment ago; its new cookie is already in the browser.
        throw unauthorized('Phiên vừa được làm mới, vui lòng thử lại.', 'REFRESH_ROTATED');
      }
      // An old token was replayed: assume theft and kill the whole session family.
      session.revokedAt = now;
      session.revokedReason = 'reuse_detected';
      await session.save();
    }
    throw unauthorized('Phiên đăng nhập không còn hiệu lực.', 'REFRESH_REUSED_OR_REVOKED');
  }

  const user = await User.findById(payload.sub).lean();
  if (!user || user.status !== 'active') {
    await AuthSession.updateOne({ _id: payload.sid }, { $set: { revokedAt: now, revokedReason: 'deactivated' } });
    throw unauthorized(MSG.ACCOUNT_SUSPENDED, 'ACCOUNT_INACTIVE');
  }

  return {
    user: toSafeUser(user),
    memberships: await loadMemberships(user._id),
    accessToken: signAccessToken({ userId: payload.sub, sessionId: payload.sid }),
    refreshToken: nextToken,
    expiresIn: Math.floor(env.accessTtlMs / 1000),
  };
}

export async function logout(refreshToken) {
  if (!refreshToken) return;
  try {
    // Expired tokens may still be used to revoke their session.
    const payload = verifyRefreshToken(refreshToken, { ignoreExpiration: true });
    await AuthSession.updateOne(
      { _id: payload.sid, userId: payload.sub, revokedAt: null },
      { $set: { revokedAt: new Date(), revokedReason: 'logout' } },
    );
  } catch {
    // Invalid token: nothing to revoke. Logout stays idempotent.
  }
}

export async function getMe(userId) {
  const user = await User.findById(userId).lean();
  if (!user) throw notFound('Không tìm thấy người dùng.');
  return { user: toSafeUser(user), memberships: await loadMemberships(userId) };
}

export async function changePassword(userId, sessionId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw notFound('Không tìm thấy người dùng.');
  const ok = await argon2.verify(user.passwordHash, currentPassword).catch(() => false);
  if (!ok) throw new AppError(400, 'INVALID_CURRENT_PASSWORD', 'Mật khẩu hiện tại không đúng.');

  user.passwordHash = await hashPassword(newPassword);
  user.passwordChangedAt = new Date();
  await user.save();

  // Sign out every other device; keep the current session alive.
  await AuthSession.updateMany(
    { userId, _id: { $ne: sessionId }, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: 'password_changed' } },
  );
}

export async function revokeAllSessions(userId, reason = 'admin', session) {
  await AuthSession.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: reason } },
    { session },
  );
}
