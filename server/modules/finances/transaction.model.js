import mongoose from '../../shared/db/mongoose.js';
import { CURRENCIES, FINANCE_TYPES, TRANSACTION_STATUS } from '../../shared/constants/enums.js';

const transactionSchema = new mongoose.Schema(
  {
    studioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Studio', required: true, immutable: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'FinanceCategory', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5000 },
    type: { type: String, enum: FINANCE_TYPES, required: true, immutable: true },
    totalAmount: { type: BigInt, required: true, min: 1n },
    // Maintained summary of effective payments — only the finance service writes it.
    paidAmount: { type: BigInt, default: 0n, min: 0n },
    paymentCount: { type: Number, default: 0, min: 0 },
    currency: { type: String, enum: CURRENCIES, default: 'VND' },
    status: { type: String, enum: TRANSACTION_STATUS, default: 'pending' },
    expectedDate: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', immutable: true },
  },
  { timestamps: true, collection: 'transactions' },
);

transactionSchema.virtual('remainingAmount').get(function remaining() {
  if (typeof this.totalAmount !== 'bigint') return undefined;
  return this.totalAmount - (this.paidAmount ?? 0n);
});

transactionSchema.index({ studioId: 1, type: 1, status: 1 });
transactionSchema.index({ studioId: 1, expectedDate: 1 });
transactionSchema.index({ studioId: 1, projectId: 1 });
transactionSchema.index({ studioId: 1, categoryId: 1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
