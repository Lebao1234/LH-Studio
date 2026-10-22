import mongoose from '../../shared/db/mongoose.js';
import { ASSIGNMENT_ROLES } from '../../shared/constants/enums.js';

const taskAssignmentSchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, immutable: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    role: { type: String, enum: ASSIGNMENT_ROLES, default: 'contributor' },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'task_assignments' },
);

// No duplicate user per task.
taskAssignmentSchema.index({ taskId: 1, userId: 1 }, { unique: true });
// At most one lead per task, enforced by the database even under concurrency.
taskAssignmentSchema.index(
  { taskId: 1 },
  { unique: true, partialFilterExpression: { role: 'lead' }, name: 'one_lead_per_task' },
);
taskAssignmentSchema.index({ userId: 1 });

export const TaskAssignment = mongoose.model('TaskAssignment', taskAssignmentSchema);
