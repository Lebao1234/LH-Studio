import mongoose from '../../shared/db/mongoose.js';
import { TASK_PRIORITY, TASK_STATUS, TASK_TYPES } from '../../shared/constants/enums.js';

const taskSchema = new mongoose.Schema(
  {
    studioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Studio', required: true, immutable: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, immutable: true },
    episodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Episode' },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 10_000 },
    type: { type: String, enum: TASK_TYPES },
    status: { type: String, enum: TASK_STATUS, default: 'todo' },
    priority: { type: String, enum: TASK_PRIORITY, default: 'medium' },
    startDate: { type: Date },
    dueDate: { type: Date },
    completedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', immutable: true },
  },
  { timestamps: true, collection: 'tasks' },
);

taskSchema.index({ studioId: 1, projectId: 1, status: 1 });
taskSchema.index({ studioId: 1, status: 1, dueDate: 1 });
taskSchema.index({ episodeId: 1 });

export const Task = mongoose.model('Task', taskSchema);
