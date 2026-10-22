import mongoose from '../../shared/db/mongoose.js';
import { FINANCE_TYPES } from '../../shared/constants/enums.js';

const financeCategorySchema = new mongoose.Schema(
  {
    studioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Studio', required: true, immutable: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 40 },
    type: { type: String, enum: FINANCE_TYPES, required: true, immutable: true },
    description: { type: String, trim: true, maxlength: 1000 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'finance_categories' },
);

financeCategorySchema.index({ studioId: 1, type: 1, code: 1 }, { unique: true });

export const FinanceCategory = mongoose.model('FinanceCategory', financeCategorySchema);
