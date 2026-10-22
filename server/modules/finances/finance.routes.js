import { Router } from 'express';
import { requireStudioManager } from '../../middlewares/authorize.js';
import { financeWriteLimiter } from '../../middlewares/rateLimiter.js';
import { validate } from '../../middlewares/validate.js';
import { idParams } from '../../shared/utils/validators.js';
import * as ctrl from './finance.controller.js';
import {
  createCategorySchema,
  createPaymentSchema,
  createTransactionSchema,
  exportTransactionsQuery,
  listCategoriesQuery,
  listTransactionsQuery,
  paymentParams,
  reversePaymentSchema,
  summaryQuery,
  updateCategorySchema,
  updateTransactionSchema,
} from './finance.validation.js';

const router = Router();

// Finance is restricted to owners and admins, for reads and writes alike.
router.use(requireStudioManager, financeWriteLimiter);

router.get('/categories', validate({ query: listCategoriesQuery }), ctrl.listCategories);
router.post('/categories', validate({ body: createCategorySchema }), ctrl.createCategory);
router.patch('/categories/:id', validate({ params: idParams, body: updateCategorySchema }), ctrl.updateCategory);

router.get('/transactions', validate({ query: listTransactionsQuery }), ctrl.listTransactions);
router.get('/transactions/export', validate({ query: exportTransactionsQuery }), ctrl.exportTransactions);
router.post('/transactions', validate({ body: createTransactionSchema }), ctrl.createTransaction);
router.get('/transactions/:id', validate({ params: idParams }), ctrl.getTransaction);
router.patch('/transactions/:id', validate({ params: idParams, body: updateTransactionSchema }), ctrl.updateTransaction);
router.delete('/transactions/:id', validate({ params: idParams }), ctrl.deleteTransaction);

router.get('/transactions/:id/payments', validate({ params: idParams }), ctrl.listPayments);
router.post('/transactions/:id/payments', validate({ params: idParams, body: createPaymentSchema }), ctrl.createPayment);
router.post(
  '/transactions/:id/payments/:paymentId/reverse',
  validate({ params: paymentParams, body: reversePaymentSchema }),
  ctrl.reversePayment,
);

router.get('/summary', validate({ query: summaryQuery }), ctrl.summary);
router.get('/expenses-by-category', validate({ query: summaryQuery }), ctrl.expensesByCategory);

export default router;
