import { beforeAll, describe, expect, it } from 'vitest';
import { bootstrapOwner, useTestDatabase } from './helpers.js';

useTestDatabase();

let owner;
let incomeCat;
let expenseCat;

const today = () => new Date().toISOString();

async function newTransaction(total = '50000000', type = 'income') {
  const res = await owner.post('/finance/transactions').send({
    title: `Hợp đồng ${Math.random()}`,
    type,
    categoryId: type === 'income' ? incomeCat._id : expenseCat._id,
    totalAmount: total,
  });
  expect(res.status).toBe(201);
  return res.body.data;
}

beforeAll(async () => {
  owner = await bootstrapOwner();
  const cats = (await owner.get('/finance/categories')).body.data;
  incomeCat = cats.find((c) => c.type === 'income');
  expenseCat = cats.find((c) => c.type === 'expense');
});

describe('transactions', () => {
  it('rejects a category whose type does not match', async () => {
    const res = await owner.post('/finance/transactions').send({ title: 'X', type: 'income', categoryId: expenseCat._id, totalAmount: '1000' });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('CATEGORY_TYPE_MISMATCH');
  });

  it('serialises amounts as exact decimal strings', async () => {
    const tx = await newTransaction('999999999999999');
    expect(tx.totalAmount).toBe('999999999999999');
    expect(tx.paidAmount).toBe('0');
    expect(tx.remainingAmount).toBe('999999999999999');
  });

  it('ignores client attempts to set paidAmount / paymentCount', async () => {
    const tx = await newTransaction('1000');
    const res = await owner.patch(`/finance/transactions/${tx._id}`).send({ paidAmount: '1000', paymentCount: 9, title: 'Renamed' });
    expect(res.status).toBe(200);
    expect(res.body.data.paidAmount).toBe('0');
    expect(res.body.data.paymentCount).toBe(0);
    expect(res.body.data.status).toBe('pending');
  });
});

describe('payments', () => {
  it('records partial payments, computes remaining, then flips to paid', async () => {
    const tx = await newTransaction('50000000');

    const p1 = await owner.post(`/finance/transactions/${tx._id}/payments`).send({ amount: '20000000', paidAt: today(), idempotencyKey: 'key-partial-0001' });
    expect(p1.status).toBe(201);
    expect(p1.body.data.status).toBe('partially_paid');
    expect(p1.body.data.paidAmount).toBe('20000000');
    expect(p1.body.data.remainingAmount).toBe('30000000');

    const p2 = await owner.post(`/finance/transactions/${tx._id}/payments`).send({ amount: '30000000', paidAt: today(), idempotencyKey: 'key-partial-0002' });
    expect(p2.status).toBe(201);
    expect(p2.body.data.status).toBe('paid');
    expect(p2.body.data.remainingAmount).toBe('0');
    expect(p2.body.data.paymentCount).toBe(2);
    expect(p2.body.data.payments).toHaveLength(2);
  });

  it('rejects overpayment', async () => {
    const tx = await newTransaction('1000000');
    const res = await owner.post(`/finance/transactions/${tx._id}/payments`).send({ amount: '1000001', paidAt: today() });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('OVERPAYMENT');
  });

  it('rejects future-dated payments', async () => {
    const tx = await newTransaction('1000000');
    const res = await owner
      .post(`/finance/transactions/${tx._id}/payments`)
      .send({ amount: '1000', paidAt: new Date(Date.now() + 3 * 86_400_000).toISOString() });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('PAYMENT_IN_FUTURE');
  });

  it('rejects a duplicate submission with the same idempotency key', async () => {
    const tx = await newTransaction('1000000');
    const body = { amount: '100000', paidAt: today(), idempotencyKey: 'dup-key-000001' };
    expect((await owner.post(`/finance/transactions/${tx._id}/payments`).send(body)).status).toBe(201);
    const dup = await owner.post(`/finance/transactions/${tx._id}/payments`).send(body);
    expect(dup.status).toBe(409);
    expect(dup.body.code).toBe('DUPLICATE_PAYMENT');

    const detail = await owner.get(`/finance/transactions/${tx._id}`);
    expect(detail.body.data.paidAmount).toBe('100000');
  });

  it('never exceeds the total under concurrent payments', async () => {
    const tx = await newTransaction('1000000');
    const attempts = Array.from({ length: 8 }, (_, i) =>
      owner.post(`/finance/transactions/${tx._id}/payments`).send({ amount: '300000', paidAt: today(), idempotencyKey: `race-key-${i}-abcdef` }),
    );
    const results = await Promise.all(attempts);
    const created = results.filter((r) => r.status === 201).length;
    expect(created).toBe(3); // 3 × 300k = 900k ≤ 1M; a 4th would overpay
    expect(results.filter((r) => r.status !== 201).every((r) => r.status === 422)).toBe(true);

    const detail = await owner.get(`/finance/transactions/${tx._id}`);
    expect(detail.body.data.paidAmount).toBe('900000');
    expect(detail.body.data.paymentCount).toBe(3);
    expect(detail.body.data.payments).toHaveLength(3);
  });

  it('concurrent duplicate submissions record exactly one payment', async () => {
    const tx = await newTransaction('1000000');
    const body = { amount: '100000', paidAt: today(), idempotencyKey: 'concurrent-dup-0001' };
    const results = await Promise.all(Array.from({ length: 5 }, () => owner.post(`/finance/transactions/${tx._id}/payments`).send(body)));
    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
    expect(results.filter((r) => r.status === 409)).toHaveLength(4);
  });

  it('reverses a payment with an auditable entry and blocks deleting/cancelling paid history', async () => {
    const tx = await newTransaction('500000');
    const paid = await owner.post(`/finance/transactions/${tx._id}/payments`).send({ amount: '500000', paidAt: today() });
    expect(paid.body.data.status).toBe('paid');

    expect((await owner.delete(`/finance/transactions/${tx._id}`)).status).toBe(409);
    const lockedEdit = await owner.patch(`/finance/transactions/${tx._id}`).send({ totalAmount: '400000' });
    expect(lockedEdit.status).toBe(422);
    expect(lockedEdit.body.code).toBe('TRANSACTION_SETTLED');

    const paymentId = paid.body.data.payments[0]._id;
    const rev = await owner.post(`/finance/transactions/${tx._id}/payments/${paymentId}/reverse`).send({ reason: 'Nhập nhầm số tiền' });
    expect(rev.status).toBe(201);
    expect(rev.body.data.paidAmount).toBe('0');
    expect(rev.body.data.status).toBe('pending');
    expect(rev.body.data.payments).toHaveLength(2); // original + reversal, history kept

    const again = await owner.post(`/finance/transactions/${tx._id}/payments/${paymentId}/reverse`).send({ reason: 'twice' });
    expect(again.status).toBe(409);
  });
});

describe('summary', () => {
  it('counts only actual payments as cash, not totalAmount', async () => {
    const before = (await owner.get('/finance/summary')).body.data;
    const income = await newTransaction('10000000', 'income');
    await owner.post(`/finance/transactions/${income._id}/payments`).send({ amount: '4000000', paidAt: today() });
    const expense = await newTransaction('3000000', 'expense');
    await owner.post(`/finance/transactions/${expense._id}/payments`).send({ amount: '1000000', paidAt: today() });

    const after = (await owner.get('/finance/summary')).body.data;
    const delta = (k) => BigInt(after[k]) - BigInt(before[k]);
    expect(delta('receivedIncome')).toBe(4000000n);
    expect(delta('paidExpense')).toBe(1000000n);
    expect(delta('netCash')).toBe(3000000n);
    expect(delta('expectedIncome')).toBe(6000000n);
    expect(delta('expectedExpense')).toBe(2000000n);

    const byCat = (await owner.get('/finance/expenses-by-category')).body.data;
    expect(BigInt(byCat.total)).toBeGreaterThanOrEqual(1000000n);
  });

  it('exports CSV with formula-injection protection', async () => {
    await owner.post('/finance/transactions').send({ title: '=HYPERLINK("x")', type: 'expense', categoryId: expenseCat._id, totalAmount: '1000' });
    const res = await owner.get('/finance/transactions/export');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text).toContain(`"'=HYPERLINK(""x"")"`);
  });
});

describe('amount validation', () => {
  it('rejects floats, negatives and amounts above the cap', async () => {
    for (const totalAmount of ['12.5', '-5', '0', 1.5, '10000000000000001']) {
      const res = await owner.post('/finance/transactions').send({ title: 'Bad', type: 'income', categoryId: incomeCat._id, totalAmount });
      expect(res.status).toBe(400);
    }
  });
});
