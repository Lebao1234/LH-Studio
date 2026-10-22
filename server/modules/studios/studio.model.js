import mongoose from '../../shared/db/mongoose.js';
import { STUDIO_STATUS } from '../../shared/constants/enums.js';

const studioSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000 },
    logoUrl: { type: String, trim: true, maxlength: 2048 },
    timezone: { type: String, default: 'Asia/Ho_Chi_Minh' },
    currency: { type: String, default: 'VND' },
    status: { type: String, enum: STUDIO_STATUS, default: 'active' },
    // The bootstrap owner: cannot be demoted or removed.
    initialOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', immutable: true },
  },
  { timestamps: true, collection: 'studios' },
);

export const Studio = mongoose.model('Studio', studioSchema);
