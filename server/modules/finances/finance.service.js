import mongoose from 'mongoose';
import { withTransaction } from '../../shared/db/transaction.js';
import { AppError, conflict, notFound, unprocessable } from '../../shared/errors/AppError.js';
import { toBigInt } from '../../shared/utils/money.js';
import { buildSort, paginationMeta, toSkip } from '../../shared/utils/pagination.js';
import { compact, escapeRegex } from '../../shared/utils/validators.js';
import { Project } from '../projects/project.model.js';
import { FinanceCategory } from './financeCategory.model.js';
import { Transaction } from './transaction.model.js';
import { TransactionPayment } from './transactionPayment.model.js';

const { ObjectId } = mongoose.Types;
const OUTSTANDING = ['planned', 'pending', 'partially_paid'];
const SETTLED = ['paid', 'cancelled'];
const SORTABLE = ['expectedDate', 'createdAt', 'updatedAt', 'totalAmount', 'title', 'status'];
const CLOCK_SKEW_MS = 5 * 60_000;

const oid = (v) => (v ? new ObjectId(String(v)) : v);

/** Signed amount of a ledger entry: reversals subtract. */
const SIGNED_AMOUNT = { $cond: [{ $eq: ['$kind', 'reversal'] }, { $multiply: ['$amount', -1] }, '$amount'] };

/** Status after a payment-summary change. */
const DERIVED_STATUS = {
  $switch: {
    branches: [
      { case: { $gte: ['$paidAmount', '$totalAmount'] }, then: 'paid' },
      { case: { $gt: ['$paidAmount', 0] }, then: 'partially_paid' },
    ],
    default: { $cond: [{ $in: ['$status', ['paid', 'partially_paid']] }, 'pending', '$status'] },
  },
};

function withRemaining(tx) {
  const total = toBigInt(tx.totalAmount);
  const paid = toBigInt(tx.paidAmount);
  return { ...tx, id: String(tx._id), remainingAmount: total - paid };
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function listCategories(ctx, q) {
  const filter = { studioId: ctx.studioId };
  if (q.type) filter.type = q.type;
  if (q.active !== undefined) filter.isActive = q.active;
  return FinanceCategory.find(filter).sort({ type: 1, name: 1 }).lean();
}

export async function createCategory(ctx, input) {
  return FinanceCategory.create({ ...compact(input), studioId: ctx.studioId }).catch((err) => {
    if (err?.code === 11000) throw conflict('Mã danh mục đã tồn tại.', 'CATEGORY_CODE_TAKEN');
    throw err;
  });
}

export async function updateCategory(ctx, categoryId, input) {
  const category = await FinanceCategory.findOne({ _id: categoryId, studioId: ctx.studioId });
  if (!category) throw notFound('Không tìm thấy danh mục.');
  category.set(compact(input));
  await category.save().catch((err) => {
    if (err?.code === 11000) throw conflict('Mã danh mục đã tồn tại.', 'CATEGORY_CODE_TAKEN');
    throw err;
  });
  return category;
}

async function assertCategory(ctx, categoryId, type, session) {
  const category = await FinanceCategory.findOne({ _id: categoryId, studioId: ctx.studioId }).session(session ?? null).lean();
  if (!category) throw unprocessable('Danh mục không thuộc studio.', 'INVALID_CATEGORY');
  if (category.type !== type) throw unprocessable('Loại danh mục không khớp với loại giao dịch.', 'CATEGORY_TYPE_MISMATCH');
  if (!category.isActive) throw unprocessable('Danh mục đã ngừng sử dụng.', 'CATEGORY_INACTIVE');
}

async function assertProject(ctx, projectId, session) {
  if (!projectId) return;
  const ok = await Project.exists({ _id: projectId, studioId: ctx.studioId }).session(session ?? null);
  if (!ok) throw unprocessable('Dự án không thuộc studio.', 'INVALID_PROJECT');
}

// ─── Transactions ────────────────────────────────────────────────────────────

async function transactionFilter(ctx, q) {
  const studioId = oid(ctx.studioId);
  const and = [{ studioId }];
  if (q.type) and.push({ type: q.type });
  if (q.categoryId) and.push({ categoryId: oid(q.categoryId) });
  if (q.projectId) and.push({ projectId: oid(q.projectId) });
  if (q.status) and.push({ status: { $in: q.status } });
  if (q.outstanding) and.push({ status: { $in: OUTSTANDING } });
  if (q.search) and.push({ title: new RegExp(escapeRegex(q.search), 'i') });

  if (q.outstanding && (q.from || q.to)) {
    // Outstanding view: everything due by the end of the period, including items
    // overdue from earlier periods, plus undated ones.
    and.push({ $or: [{ expectedDate: q.to ? { $lte: q.to } : { $exists: true } }, { expectedDate: null }] });
  } else if (q.from || q.to) {
    // In the ledger a transaction belongs to a period if it is expected then, had a
    // cash movement then, or (undated) was created then.
    const range = { ...(q.from ? { $gte: q.from } : {}), ...(q.to ? { $lte: q.to } : {}) };
    const paidIds = await TransactionPayment.distinct('transactionId', { studioId, paidAt: range });
    and.push({
      $or: [{ expectedDate: range }, { _id: { $in: paidIds } }, { expectedDate: null, createdAt: range }],
    });
  }
  return { $and: and };
}

const TX_POPULATE = [
  { path: 'categoryId', select: 'name code type' },
  { path: 'projectId', select: 'code title' },
  { path: 'createdBy', select: 'name' },
];

function shapeTx(tx) {
  const { categoryId, projectId, ...rest } = tx;
  return withRemaining({
    ...rest,
    categoryId: categoryId?._id ?? categoryId,
    category: categoryId?.name ? categoryId : null,
    projectId: projectId?._id ?? projectId ?? null,
    project: projectId?.title ? projectId : null,
  });
}

export async function listTransactions(ctx, q) {
  const filter = await transactionFilter(ctx, q);
  const [items, total] = await Promise.all([
    Transaction.find(filter).populate(TX_POPULATE).sort(buildSort(q.sort, SORTABLE, '-createdAt')).skip(toSkip(q)).limit(q.limit).lean(),
    Transaction.countDocuments(filter),
  ]);
  return { items: items.map(shapeTx), meta: paginationMeta(q, total) };
}

async function loadTransaction(ctx, id, session) {
  if (!mongoose.isValidObjectId(id)) throw notFound('Không tìm thấy giao dịch.');
  const tx = await Transaction.findOne({ _id: id, studioId: ctx.studioId }).session(session ?? null);
  if (!tx) throw notFound('Không tìm thấy giao dịch.');
  return tx;
}

export async function getTransaction(ctx, id) {
  const tx = await loadTransaction(ctx, id);
  const populated = await Transaction.findById(tx._id).populate(TX_POPULATE).lean();
  const payments = await listPayments(ctx, id);
  return { ...shapeTx(populated), payments };
}

export async function createTransaction(ctx, input) {
  await assertCategory(ctx, input.categoryId, input.type);
  await assertProject(ctx, input.projectId);
  const tx = await Transaction.create({
    ...compact(input),
    studioId: ctx.studioId,
    currency: 'VND',
    paidAmount: 0n,
    paymentCount: 0,
    createdBy: ctx.userId,
  });
  return getTransaction(ctx, tx._id);
}

export async function updateTransaction(ctx, id, input) {
  const changes = compact(input);

  await withTransaction(async (session) => {
    const tx = await loadTransaction(ctx, id, session);

    if (SETTLED.includes(tx.status)) {
      const locked = Object.keys(changes).filter((k) => !['title', 'description'].includes(k));
      if (locked.length) {
        throw unprocessable('Giao dịch đã tất toán/hủy: chỉ được sửa nội dung và mô tả.', 'TRANSACTION_SETTLED', locked.map((path) => ({ path, message: 'Locked' })));
      }
    }

    if (changes.categoryId) await assertCategory(ctx, changes.categoryId, tx.type, session);
    if (changes.projectId) await assertProject(ctx, changes.projectId, session);

    const paid = tx.paidAmount ?? 0n;
    if (changes.totalAmount !== undefined && changes.totalAmount < paid) {
      throw unprocessable('Tổng tiền không thể nhỏ hơn số đã thanh toán.', 'TOTAL_BELOW_PAID');
    }
    if (changes.status && paid > 0n) {
      throw unprocessable(
        changes.status === 'cancelled'
          ? 'Giao dịch đã có thanh toán. Hãy điều chỉnh (đảo) các khoản thanh toán trước khi hủy.'
          : 'Trạng thái của giao dịch đã có thanh toán được tính tự động.',
        'STATUS_DERIVED',
      );
    }

    // Conditional on the payment summary we validated against, so a concurrent payment
    // cannot slip in between (the transaction would also abort on write conflict).
    // Pipeline updates are not cast by Mongoose and treat "$x" strings as field paths,
    // so every user value is cast here and wrapped in $literal.
    const literalSet = Object.fromEntries(
      Object.entries(changes).map(([key, value]) => {
        const cast = ['categoryId', 'projectId'].includes(key) && value ? oid(value) : value;
        return [key, { $literal: cast }];
      }),
    );
    const updated = await Transaction.findOneAndUpdate(
      { _id: tx._id, paidAmount: paid },
      [{ $set: { ...literalSet, updatedAt: '$$NOW' } }, { $set: { status: DERIVED_STATUS } }],
      { session, returnDocument: 'after', updatePipeline: true },
    );
    if (!updated) throw conflict('Giao dịch vừa được cập nhật bởi người khác. Vui lòng tải lại.', 'CONCURRENT_MODIFICATION');
  });

  return getTransaction(ctx, id);
}

export async function deleteTransaction(ctx, id) {
  const tx = await loadTransaction(ctx, id);
  if (tx.paymentCount > 0 || (await TransactionPayment.exists({ transactionId: tx._id }))) {
    throw conflict('Không thể xóa giao dịch đã có lịch sử thanh toán. Hãy chuyển sang "Đã hủy".', 'TRANSACTION_HAS_PAYMENTS');
  }
  const result = await Transaction.deleteOne({ _id: tx._id, paymentCount: 0 });
  if (!result.deletedCount) throw conflict('Giao dịch vừa phát sinh thanh toán.', 'CONCURRENT_MODIFICATION');
}

// ─── Payments ────────────────────────────────────────────────────────────────

export async function listPayments(ctx, transactionId) {
  const tx = await loadTransaction(ctx, transactionId);
  return TransactionPayment.find({ transactionId: tx._id })
    .populate({ path: 'recordedBy', select: 'name' })
    .sort({ paidAt: -1, createdAt: -1 })
    .lean();
}

function duplicatePayment(existing) {
  return new AppError(409, 'DUPLICATE_PAYMENT', 'Khoản thanh toán này đã được ghi nhận (yêu cầu trùng lặp).', [
    { path: 'idempotencyKey', message: `Existing payment ${existing?._id ?? ''}`.trim() },
  ]);
}

/**
 * Records a (partial) payment. Concurrency safety comes from three layers:
 *  1. snapshot-isolated multi-document transaction (concurrent writers to the same
 *     transaction document hit a write conflict and the callback is retried);
 *  2. a conditional pipeline update that only applies if paidAmount + amount <= totalAmount;
 *  3. a unique (transactionId, idempotencyKey) index against duplicate submissions.
 */
export async function recordPayment(ctx, transactionId, input) {
  if (input.paidAt.getTime() > Date.now() + CLOCK_SKEW_MS) {
    throw unprocessable('Không ghi nhận thanh toán cho ngày trong tương lai.', 'PAYMENT_IN_FUTURE');
  }
  const amount = input.amount;

  try {
    await withTransaction(async (session) => {
      const tx = await loadTransaction(ctx, transactionId, session);

      if (input.idempotencyKey) {
        const existing = await TransactionPayment.findOne({ transactionId: tx._id, idempotencyKey: input.idempotencyKey })
          .session(session)
          .lean();
        if (existing) throw duplicatePayment(existing);
      }
      if (tx.status === 'cancelled') throw conflict('Giao dịch đã bị hủy.', 'TRANSACTION_CANCELLED');

      const remaining = tx.totalAmount - tx.paidAmount;
      if (amount > remaining) {
        throw unprocessable(`Số tiền vượt quá số còn lại (${remaining.toString()} ₫).`, 'OVERPAYMENT', [
          { path: 'amount', message: `remaining=${remaining.toString()}` },
        ]);
      }

      const updated = await Transaction.findOneAndUpdate(
        {
          _id: tx._id,
          status: { $ne: 'cancelled' },
          $expr: { $lte: [{ $add: ['$paidAmount', amount] }, '$totalAmount'] },
        },
        [
          { $set: { paidAmount: { $add: ['$paidAmount', amount] }, paymentCount: { $add: ['$paymentCount', 1] }, updatedAt: '$$NOW' } },
          { $set: { status: DERIVED_STATUS } },
        ],
        { session, returnDocument: 'after', updatePipeline: true },
      );
      if (!updated) throw unprocessable('Số tiền vượt quá số còn lại.', 'OVERPAYMENT');

      await TransactionPayment.create(
        [
          {
            transactionId: tx._id,
            studioId: tx.studioId,
            kind: 'payment',
            amount,
            paidAt: input.paidAt,
            method: input.method,
            referenceNumber: input.referenceNumber,
            note: input.note,
            idempotencyKey: input.idempotencyKey,
            recordedBy: ctx.userId,
          },
        ],
        { session },
      );
    });
  } catch (err) {
    if (err?.code === 11000) throw duplicatePayment();
    throw err;
  }

  return getTransaction(ctx, transactionId);
}

/** Auditable correction: appends a reversal entry instead of editing history. */
export async function reversePayment(ctx, transactionId, paymentId, { reason }) {
  try {
    await withTransaction(async (session) => {
      const tx = await loadTransaction(ctx, transactionId, session);
      const original = await TransactionPayment.findOne({ _id: paymentId, transactionId: tx._id }).session(session);
      if (!original) throw notFound('Không tìm thấy khoản thanh toán.');
      if (original.kind !== 'payment') throw unprocessable('Không thể đảo một bút toán điều chỉnh.', 'INVALID_REVERSAL');
      if (original.reversedByPaymentId) throw conflict('Khoản thanh toán đã được điều chỉnh trước đó.', 'ALREADY_REVERSED');

      const updated = await Transaction.findOneAndUpdate(
        { _id: tx._id, $expr: { $gte: ['$paidAmount', original.amount] } },
        [
          {
            $set: {
              paidAmount: { $subtract: ['$paidAmount', original.amount] },
              paymentCount: { $max: [0, { $subtract: ['$paymentCount', 1] }] },
              updatedAt: '$$NOW',
            },
          },
          { $set: { status: DERIVED_STATUS } },
        ],
        { session, returnDocument: 'after', updatePipeline: true },
      );
      if (!updated) throw conflict('Tổng thanh toán không nhất quán, vui lòng đối soát.', 'LEDGER_INCONSISTENT');

      const [reversal] = await TransactionPayment.create(
        [
          {
            transactionId: tx._id,
            studioId: tx.studioId,
            kind: 'reversal',
            amount: original.amount,
            paidAt: new Date(),
            method: original.method,
            note: reason,
            reversesPaymentId: original._id,
            recordedBy: ctx.userId,
          },
        ],
        { session },
      );
      original.reversedByPaymentId = reversal._id;
      await original.save({ session });
    });
  } catch (err) {
    if (err?.code === 11000) throw conflict('Khoản thanh toán đã được điều chỉnh trước đó.', 'ALREADY_REVERSED');
    throw err;
  }
  return getTransaction(ctx, transactionId);
}

// ─── Reports ─────────────────────────────────────────────────────────────────

function txLookupFilter(q) {
  const match = {};
  if (q.type) match['tx.type'] = q.type;
  if (q.categoryId) match['tx.categoryId'] = oid(q.categoryId);
  if (q.projectId) match['tx.projectId'] = oid(q.projectId);
  if (q.status) match['tx.status'] = { $in: q.status };
  return match;
}

function paidAtRange(q) {
  if (!q.from && !q.to) return {};
  return { paidAt: { ...(q.from ? { $gte: q.from } : {}), ...(q.to ? { $lte: q.to } : {}) } };
}

function cashPipeline(ctx, q, extraMatch = {}) {
  return [
    { $match: { studioId: oid(ctx.studioId), ...paidAtRange(q) } },
    { $lookup: { from: 'transactions', localField: 'transactionId', foreignField: '_id', as: 'tx' } },
    { $unwind: '$tx' },
    { $match: { ...txLookupFilter(q), ...extraMatch } },
  ];
}

/**
 * Cash figures use payment records (paidAt); expected figures use the unpaid
 * remainder of outstanding transactions (expectedDate). totalAmount is never
 * counted as cash.
 */
export async function getSummary(ctx, q) {
  const scope = {
    studioId: oid(ctx.studioId),
    ...(q.type ? { type: q.type } : {}),
    ...(q.categoryId ? { categoryId: oid(q.categoryId) } : {}),
    ...(q.projectId ? { projectId: oid(q.projectId) } : {}),
  };
  const outstandingStatuses = q.status ? OUTSTANDING.filter((s) => q.status.includes(s)) : OUTSTANDING;
  const [cash, expected, overdue] = await Promise.all([
    TransactionPayment.aggregate([
      ...cashPipeline(ctx, q),
      { $group: { _id: '$tx.type', amount: { $sum: SIGNED_AMOUNT }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      {
        $match: {
          ...scope,
          status: { $in: outstandingStatuses },
          ...(q.from || q.to ? { expectedDate: { ...(q.from ? { $gte: q.from } : {}), ...(q.to ? { $lte: q.to } : {}) } } : {}),
        },
      },
      { $group: { _id: '$type', amount: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } }, count: { $sum: 1 } } },
    ]),
    Transaction.countDocuments({ ...scope, status: { $in: outstandingStatuses }, expectedDate: { $lt: new Date() } }),
  ]);

  const pick = (rows, type) => rows.find((r) => r._id === type);
  const receivedIncome = toBigInt(pick(cash, 'income')?.amount);
  const paidExpense = toBigInt(pick(cash, 'expense')?.amount);
  const expectedIncome = toBigInt(pick(expected, 'income')?.amount);
  const expectedExpense = toBigInt(pick(expected, 'expense')?.amount);
  const netCash = receivedIncome - paidExpense;

  return {
    receivedIncome,
    paidExpense,
    netCash,
    expectedIncome,
    expectedExpense,
    projectedNet: netCash + expectedIncome - expectedExpense,
    counts: {
      incomePayments: pick(cash, 'income')?.count ?? 0,
      expensePayments: pick(cash, 'expense')?.count ?? 0,
      expectedIncome: pick(expected, 'income')?.count ?? 0,
      expectedExpense: pick(expected, 'expense')?.count ?? 0,
      overdueExpected: overdue,
    },
    range: { from: q.from ?? null, to: q.to ?? null },
  };
}

export async function expensesByCategory(ctx, q) {
  const type = q.type ?? 'expense';
  const rows = await TransactionPayment.aggregate([
    ...cashPipeline(ctx, { ...q, type }),
    { $group: { _id: '$tx.categoryId', amount: { $sum: SIGNED_AMOUNT }, payments: { $sum: 1 } } },
    { $lookup: { from: 'finance_categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    { $sort: { amount: -1 } },
  ]);
  const total = rows.reduce((sum, r) => sum + toBigInt(r.amount), 0n);
  return {
    type,
    total,
    items: rows
      .filter((r) => toBigInt(r.amount) !== 0n)
      .map((r) => ({
        categoryId: r._id,
        name: r.category?.name ?? 'Không rõ',
        code: r.category?.code ?? '',
        amount: toBigInt(r.amount),
        payments: r.payments,
        // Basis points to avoid floats; 10000 = 100%.
        shareBp: total > 0n ? Number((toBigInt(r.amount) * 10000n) / total) : 0,
      })),
  };
}

/** Cash in/out grouped by calendar month in the studio timezone. */
export async function monthlyCashflow(ctx, { months = 6 } = {}) {
  const tz = ctx.studio?.timezone || 'Asia/Ho_Chi_Minh';
  const from = new Date();
  from.setUTCMonth(from.getUTCMonth() - (months - 1), 1);
  from.setUTCHours(0, 0, 0, 0);

  const rows = await TransactionPayment.aggregate([
    ...cashPipeline(ctx, { from }),
    {
      $group: {
        _id: { month: { $dateToString: { format: '%Y-%m', date: '$paidAt', timezone: tz } }, type: '$tx.type' },
        amount: { $sum: SIGNED_AMOUNT },
      },
    },
  ]);

  const series = [];
  const cursor = new Date(from);
  for (let i = 0; i < months; i += 1) {
    const key = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}`;
    const income = toBigInt(rows.find((r) => r._id.month === key && r._id.type === 'income')?.amount);
    const expense = toBigInt(rows.find((r) => r._id.month === key && r._id.type === 'expense')?.amount);
    series.push({ month: key, income, expense, net: income - expense });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return series;
}

// ─── CSV export ──────────────────────────────────────────────────────────────

const STATUS_LABEL = { planned: 'Dự kiến', pending: 'Chờ thanh toán', partially_paid: 'Thanh toán một phần', paid: 'Đã thanh toán', cancelled: 'Đã hủy' };

function csvCell(value) {
  let s = value === null || value === undefined ? '' : String(value);
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const isoDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export async function exportTransactionsCsv(ctx, q) {
  const filter = await transactionFilter(ctx, q);
  const items = await Transaction.find(filter).populate(TX_POPULATE).sort(buildSort(q.sort, SORTABLE, '-createdAt')).limit(5000).lean();

  const header = ['Ngày dự kiến', 'Nội dung', 'Loại', 'Danh mục', 'Dự án', 'Tổng tiền (VND)', 'Đã thanh toán (VND)', 'Còn lại (VND)', 'Trạng thái', 'Số lần thanh toán', 'Ngày tạo'];
  const lines = items.map(shapeTx).map((t) =>
    [
      isoDate(t.expectedDate),
      t.title,
      t.type === 'income' ? 'Thu' : 'Chi',
      t.category?.name ?? '',
      t.project ? `${t.project.code} - ${t.project.title}` : '',
      toBigInt(t.totalAmount).toString(),
      toBigInt(t.paidAmount).toString(),
      t.remainingAmount.toString(),
      STATUS_LABEL[t.status] ?? t.status,
      t.paymentCount,
      isoDate(t.createdAt),
    ]
      .map(csvCell)
      .join(','),
  );
  // BOM so Excel opens UTF-8 Vietnamese text correctly.
  return `﻿${[header.map(csvCell).join(','), ...lines].join('\r\n')}\r\n`;
}
