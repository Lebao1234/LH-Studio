import mongoose from '../../shared/db/mongoose.js';
import { USER_STATUS } from '../../shared/constants/enums.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    avatarUrl: { type: String, trim: true, maxlength: 2048 },
    phone: { type: String, trim: true, maxlength: 30 },
    status: { type: String, enum: USER_STATUS, default: 'active' },
    lastLoginAt: { type: Date },
    passwordChangedAt: { type: Date },
  },
  { timestamps: true, collection: 'users' },
);

/** Public projection used whenever a user is embedded in another response. */
export const USER_PUBLIC_FIELDS = 'name email avatarUrl status';

export function toSafeUser(user) {
  if (!user) return null;
  const obj = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
  delete obj.passwordHash;
  delete obj.passwordChangedAt;
  return obj;
}

export const User = mongoose.model('User', userSchema);
