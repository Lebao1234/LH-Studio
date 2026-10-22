import mongoose from '../../shared/db/mongoose.js';
import { STUDIO_ROLES } from '../../shared/constants/enums.js';

// Supporting security collection (not one of the 14 business collections):
// invitation-controlled registration for people who do not yet have an account.
const invitationSchema = new mongoose.Schema(
  {
    studioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Studio', required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, trim: true, maxlength: 100 },
    role: { type: String, enum: STUDIO_ROLES.filter((r) => r !== 'owner'), required: true },
    tokenHash: { type: String, required: true, unique: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date },
    acceptedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    revokedAt: { type: Date },
  },
  { timestamps: true, collection: 'studio_invitations' },
);

invitationSchema.index({ studioId: 1, email: 1, acceptedAt: 1 });

export const Invitation = mongoose.model('Invitation', invitationSchema);
