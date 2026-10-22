import mongoose from '../../shared/db/mongoose.js';
import { POST_STATUS } from '../../shared/constants/enums.js';

const postSchema = new mongoose.Schema(
  {
    studioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Studio', required: true, immutable: true },
    channelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    episodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Episode', default: null },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    content: { type: String, maxlength: 20_000 },
    mediaUrls: {
      type: [{ type: String, trim: true, maxlength: 2048 }],
      default: undefined,
      validate: { validator: (v) => !v || v.length <= 20, message: 'Tối đa 20 media URL.' },
    },
    status: { type: String, enum: POST_STATUS, default: 'draft' },
    scheduledAt: { type: Date },
    publishedAt: { type: Date },
    externalPostId: { type: String, trim: true, maxlength: 200 },
    externalUrl: { type: String, trim: true, maxlength: 2048 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', immutable: true },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'posts' },
);

// Schema-level invariants (the service validates first and gives nicer errors).
postSchema.pre('validate', function enforceStatusDates() {
  if (this.status === 'scheduled' && !this.scheduledAt) {
    this.invalidate('scheduledAt', 'Bài viết đã lên lịch phải có thời gian đăng.');
  }
  if (this.status === 'published' && !this.publishedAt) {
    this.invalidate('publishedAt', 'Bài viết đã đăng phải có thời gian đăng.');
  }
  if (this.episodeId && !this.projectId) {
    this.invalidate('projectId', 'Bài viết gắn tập phim phải gắn dự án.');
  }
});

postSchema.index({ studioId: 1, scheduledAt: 1 });
postSchema.index({ studioId: 1, publishedAt: 1 });
postSchema.index({ studioId: 1, status: 1, updatedAt: -1 });
postSchema.index({ channelId: 1 });
postSchema.index({ projectId: 1 });
postSchema.index({ episodeId: 1 });

export const Post = mongoose.model('Post', postSchema);
