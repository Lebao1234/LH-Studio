import mongoose from '../../shared/db/mongoose.js';
import { PAYMENT_KINDS, PAYMENT_METHODS } from '../../shared/constants/enums.js';

// Append-only ledger. Corrections are recorded as `reversal` entries that point at
// the original payment; history is never rewritten.
const transactionPaymentSchema = new mongoose.Schema(
  {
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true, immutable: true },
    // Denormalised for studio-scoped queries; never changes.
    studioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Studio', required: true, immutable: true },
    kind: { type: String, enum: PAYMENT_KINDS, default: 'payment', immutable: true },
    amount: { type: BigInt, required: true, min: 1n, immutable: true },
    paidAt: { type: Date, required: true, immutable: true },
    method: { type: String, enum: PAYMENT_METHODS, default: 'bank_transfer' },
    referenceNumber: { type: String, trim: true, maxlength: 100 },
    note: { type: String, trim: true, maxlength: 1000 },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', immutable: true },
    idempotencyKey: { type: String, trim: true, maxlength: 100, immutable: true },
    reversesPaymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'TransactionPayment', immutable: true },
    reversedByPaymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'TransactionPayment' },
  },
  { timestamps: true, collection: 'transaction_payments' },
);

transactionPaymentSchema.index({ transactionId: 1, paidAt: 1 });
transactionPaymentSchema.index({ studioId: 1, paidAt: 1 });
// Duplicate-submission protection, scoped per transaction.
transactionPaymentSchema.index(
  { transactionId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } }, name: 'payment_idempotency' },
);
// A payment can be reversed at most once.
transactionPaymentSchema.index(
  { reversesPaymentId: 1 },
  { unique: true, partialFilterExpression: { reversesPaymentId: { $type: 'objectId' } }, name: 'single_reversal' },
);

export const TransactionPayment = mongoose.model('TransactionPayment', transactionPaymentSchema);
