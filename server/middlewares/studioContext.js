import mongoose from 'mongoose';
import { StudioMember } from '../modules/studios/studioMember.model.js';
import { Studio } from '../modules/studios/studio.model.js';
import { forbidden } from '../shared/errors/AppError.js';
import { MSG } from '../shared/constants/messages.js';

/**
 * Resolves the "current studio" for the authenticated user. A client may pick a
 * studio with the X-Studio-Id header; otherwise the earliest active membership wins.
 * All downstream services scope every query by req.ctx.studioId.
 */
export async function studioContext(req, _res, next) {
  const requested = req.get('X-Studio-Id');
  const filter = { userId: req.auth.userId, status: 'active' };
  if (requested) {
    if (!mongoose.isValidObjectId(requested)) return next(forbidden(MSG.NO_STUDIO, 'NO_STUDIO_ACCESS'));
    filter.studioId = requested;
  }

  const membership = await StudioMember.findOne(filter).sort({ joinedAt: 1 }).lean();
  if (!membership) return next(forbidden(MSG.NO_STUDIO, 'NO_STUDIO_ACCESS'));

  const studio = await Studio.findOne({ _id: membership.studioId, status: 'active' }).lean();
  if (!studio) return next(forbidden(MSG.NO_STUDIO, 'NO_STUDIO_ACCESS'));

  req.ctx = {
    userId: req.auth.userId,
    studioId: String(studio._id),
    studio,
    role: membership.role,
    membershipId: String(membership._id),
  };
  return next();
}
