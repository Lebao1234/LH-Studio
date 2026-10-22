import { env } from '../../config/env.js';
import { withTransaction } from '../../shared/db/transaction.js';
import { conflict, forbidden, notFound } from '../../shared/errors/AppError.js';
import { compact } from '../../shared/utils/validators.js';
import { hashToken, randomToken } from '../auth/tokens.js';
import { User, USER_PUBLIC_FIELDS } from '../users/user.model.js';
import { Invitation } from './invitation.model.js';
import { Studio } from './studio.model.js';
import { StudioMember } from './studioMember.model.js';

export async function getCurrentStudio(ctx) {
  const memberCount = await StudioMember.countDocuments({ studioId: ctx.studioId, status: 'active' });
  return { studio: ctx.studio, myRole: ctx.role, memberCount };
}

export async function updateCurrentStudio(ctx, input) {
  const studio = await Studio.findByIdAndUpdate(ctx.studioId, { $set: compact(input) }, { returnDocument: 'after', runValidators: true });
  return studio;
}

export async function listMembers(ctx, { status }) {
  const filter = { studioId: ctx.studioId, ...(status ? { status } : {}) };
  // Contact details and login activity are visible to owners/admins only.
  const isManager = ['owner', 'admin'].includes(ctx.role);
  const members = await StudioMember.find(filter)
    .populate({ path: 'userId', select: isManager ? `${USER_PUBLIC_FIELDS} phone lastLoginAt` : USER_PUBLIC_FIELDS })
    .sort({ status: 1, joinedAt: 1 })
    .lean();
  return members.map(({ userId, ...m }) => ({
    ...m,
    user: userId,
    userId: userId?._id,
    isInitialOwner: String(userId?._id) === String(ctx.studio.initialOwnerId),
  }));
}

export async function addMember(ctx, { email, name, role }) {
  // Owner role is never granted through invitations (schema excludes it); promote later.
  const existingUser = await User.findOne({ email }).lean();

  if (existingUser) {
    const membership = await StudioMember.findOne({ studioId: ctx.studioId, userId: existingUser._id });
    if (membership?.status === 'active') throw conflict('Người này đã là thành viên studio.', 'ALREADY_MEMBER');
    if (membership) {
      membership.status = 'active';
      membership.role = role;
      membership.joinedAt = new Date();
      await membership.save();
      return { type: 'member', member: membership };
    }
    const created = await StudioMember.create({ studioId: ctx.studioId, userId: existingUser._id, role });
    return { type: 'member', member: created };
  }

  // No account yet → invitation-controlled registration.
  const token = randomToken(32);
  const invitation = await withTransaction(async (session) => {
    await Invitation.updateMany(
      { studioId: ctx.studioId, email, acceptedAt: null, revokedAt: null },
      { $set: { revokedAt: new Date() } },
      { session },
    );
    const [inv] = await Invitation.create(
      [
        {
          studioId: ctx.studioId,
          email,
          name,
          role,
          tokenHash: hashToken(token),
          invitedBy: ctx.userId,
          expiresAt: new Date(Date.now() + env.INVITE_EXPIRES_DAYS * 86_400_000),
        },
      ],
      { session },
    );
    return inv;
  });

  return {
    type: 'invitation',
    invitation,
    // Shown once to the inviter (no e-mail service in V1).
    inviteUrl: `${env.clientOrigins[0]}/register?invite=${encodeURIComponent(token)}`,
  };
}

async function activeOwnerCount(studioId, session) {
  return StudioMember.countDocuments({ studioId, role: 'owner', status: 'active' }).session(session ?? null);
}

function assertCanManage(ctx, target) {
  if (String(target.userId) === String(ctx.studio.initialOwnerId)) {
    throw forbidden('Không thể thay đổi chủ sở hữu khởi tạo studio.', 'PROTECTED_OWNER');
  }
  if (ctx.role !== 'owner' && target.role === 'owner') {
    throw forbidden('Chỉ chủ sở hữu mới có thể thay đổi chủ sở hữu khác.', 'OWNER_ONLY');
  }
}

export async function updateMember(ctx, memberId, { role, status }) {
  return withTransaction(async (session) => {
    const target = await StudioMember.findOne({ _id: memberId, studioId: ctx.studioId }).session(session);
    if (!target) throw notFound('Không tìm thấy thành viên.');
    assertCanManage(ctx, target);
    if (role === 'owner' && ctx.role !== 'owner') throw forbidden('Chỉ chủ sở hữu mới có thể cấp quyền chủ sở hữu.', 'OWNER_ONLY');

    const losesOwner = target.role === 'owner' && target.status === 'active' && ((role && role !== 'owner') || status === 'inactive');
    if (losesOwner && (await activeOwnerCount(ctx.studioId, session)) <= 1) {
      throw conflict('Studio phải còn ít nhất một chủ sở hữu.', 'LAST_OWNER');
    }

    if (role) target.role = role;
    if (status) target.status = status;
    await target.save({ session });
    return target;
  });
}

export async function deactivateMember(ctx, memberId) {
  return updateMember(ctx, memberId, { status: 'inactive' });
}

export async function removeMember(ctx, memberId) {
  return withTransaction(async (session) => {
    const target = await StudioMember.findOne({ _id: memberId, studioId: ctx.studioId }).session(session);
    if (!target) throw notFound('Không tìm thấy thành viên.');
    assertCanManage(ctx, target);
    if (target.status === 'pending') {
      await StudioMember.deleteOne({ _id: memberId }).session(session);
      return { _id: memberId, status: 'rejected' };
    }
    return updateMember(ctx, memberId, { status: 'inactive' });
  });
}

export async function listInvitations(ctx) {
  return Invitation.find({ studioId: ctx.studioId, acceptedAt: null, revokedAt: null, expiresAt: { $gt: new Date() } })
    .select('-tokenHash')
    .populate({ path: 'invitedBy', select: 'name' })
    .sort({ createdAt: -1 })
    .lean();
}

export async function revokeInvitation(ctx, invitationId) {
  const result = await Invitation.updateOne(
    { _id: invitationId, studioId: ctx.studioId, acceptedAt: null, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
  if (!result.matchedCount) throw notFound('Không tìm thấy lời mời.');
}
