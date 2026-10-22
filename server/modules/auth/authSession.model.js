import mongoose from '../../shared/db/mongoose.js';

// Supporting security collection: one document per login "family". The current
// refresh token hash rotates on every refresh; presenting an older token is
// treated as token reuse and revokes the whole session.
const authSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true },
    previousTokenHash: { type: String },
    rotatedAt: { type: Date },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
    revokedReason: { type: String, enum: ['logout', 'reuse_detected', 'password_changed', 'admin', 'deactivated'] },
    lastUsedAt: { type: Date },
    userAgent: { type: String, maxlength: 300 },
    ip: { type: String, maxlength: 64 },
  },
  { timestamps: true, collection: 'auth_sessions' },
);

// MongoDB removes sessions automatically once they expire.
authSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AuthSession = mongoose.model('AuthSession', authSessionSchema);
