import mongoose from '../../shared/db/mongoose.js';
import { PROJECT_PRIORITY, PROJECT_STATUS } from '../../shared/constants/enums.js';

const projectSchema = new mongoose.Schema(
  {
    studioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Studio', required: true, immutable: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
    category: { type: String, trim: true, uppercase: true, maxlength: 20, default: 'KID' },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5000 },
    coverUrl: { type: String, trim: true, maxlength: 2048 },
    status: { type: String, enum: PROJECT_STATUS, default: 'planning' },
    priority: { type: String, enum: PROJECT_PRIORITY },
    startDate: { type: Date },
    dueDate: { type: Date },
    completedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
  },
  { timestamps: true, collection: 'projects' },
);

projectSchema.index({ studioId: 1, code: 1 }, { unique: true });
projectSchema.index({ studioId: 1, status: 1, updatedAt: -1 });
projectSchema.index({ studioId: 1, dueDate: 1 });

export const Project = mongoose.model('Project', projectSchema);
