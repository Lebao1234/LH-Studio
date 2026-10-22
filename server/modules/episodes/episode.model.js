import mongoose from '../../shared/db/mongoose.js';
import { EPISODE_STATUS } from '../../shared/constants/enums.js';

const episodeSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, immutable: true },
    episodeNumber: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'episodeNumber must be an integer' },
    },
    code: { type: String, trim: true, uppercase: true, maxlength: 50 },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5000 },
    script: { type: String, maxlength: 100_000 },
    coverUrl: { type: String, trim: true, maxlength: 2048 },
    videoUrl: { type: String, trim: true, maxlength: 2048 },
    status: { type: String, enum: EPISODE_STATUS, default: 'planned' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startDate: { type: Date },
    dueDate: { type: Date },
    completedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', immutable: true },
  },
  { timestamps: true, collection: 'episodes' },
);

episodeSchema.index({ projectId: 1, episodeNumber: 1 }, { unique: true });
episodeSchema.index({ assignedTo: 1, status: 1 });

export const Episode = mongoose.model('Episode', episodeSchema);
