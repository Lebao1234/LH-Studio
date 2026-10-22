import mongoose from '../../shared/db/mongoose.js';
import { CHANNEL_STATUS, PLATFORMS } from '../../shared/constants/enums.js';

// Platform OAuth tokens are intentionally NOT stored here. A future integration
// must keep them encrypted in a separate, access-restricted collection.
const channelSchema = new mongoose.Schema(
  {
    studioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Studio', required: true, immutable: true },
    platform: { type: String, enum: PLATFORMS, required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    handle: { type: String, trim: true, maxlength: 120 },
    platformChannelId: { type: String, trim: true, maxlength: 200 },
    channelUrl: { type: String, trim: true, maxlength: 2048 },
    avatarUrl: { type: String, trim: true, maxlength: 2048 },
    status: { type: String, enum: CHANNEL_STATUS, default: 'active' },
  },
  { timestamps: true, collection: 'channels' },
);

channelSchema.index({ studioId: 1, platform: 1, status: 1 });

export const Channel = mongoose.model('Channel', channelSchema);
