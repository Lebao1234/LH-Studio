import mongoose from '../../shared/db/mongoose.js';
import { METRIC_SOURCES } from '../../shared/constants/enums.js';

// Cumulative snapshot at recordedAt (not a delta). Counters are BSON Long.
const postMetricSchema = new mongoose.Schema(
  {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, immutable: true },
    recordedAt: { type: Date, required: true },
    views: { type: BigInt, default: 0n, min: 0n },
    likes: { type: BigInt, default: 0n, min: 0n },
    comments: { type: BigInt, min: 0n },
    shares: { type: BigInt, min: 0n },
    watchTimeSeconds: { type: BigInt, min: 0n },
    source: { type: String, enum: METRIC_SOURCES, default: 'manual' },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'post_metrics' },
);

postMetricSchema.index({ postId: 1, recordedAt: -1 });

export const PostMetric = mongoose.model('PostMetric', postMetricSchema);
