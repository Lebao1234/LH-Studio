import mongoose from '../../shared/db/mongoose.js';
import { PROJECT_ROLES } from '../../shared/constants/enums.js';

const projectMemberSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, immutable: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    role: { type: String, enum: PROJECT_ROLES, default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'project_members' },
);

projectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });
projectMemberSchema.index({ userId: 1 });

export const ProjectMember = mongoose.model('ProjectMember', projectMemberSchema);
