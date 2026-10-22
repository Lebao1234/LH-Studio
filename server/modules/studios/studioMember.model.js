import mongoose from '../../shared/db/mongoose.js';
import { MEMBER_STATUS, STUDIO_ROLES } from '../../shared/constants/enums.js';

const studioMemberSchema = new mongoose.Schema(
  {
    studioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Studio', required: true, immutable: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    role: { type: String, enum: STUDIO_ROLES, required: true, default: 'member' },
    status: { type: String, enum: MEMBER_STATUS, default: 'active' },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'studio_members' },
);

studioMemberSchema.index({ studioId: 1, userId: 1 }, { unique: true });
studioMemberSchema.index({ userId: 1, status: 1 });
studioMemberSchema.index({ studioId: 1, role: 1, status: 1 });

export const StudioMember = mongoose.model('StudioMember', studioMemberSchema);
