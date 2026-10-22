import { Router } from 'express';
import { requireStudioManager } from '../../middlewares/authorize.js';
import { sendSuccess } from '../../shared/utils/response.js';
import * as service from './dashboard.service.js';

const router = Router();

const handle = (fn) => async (req, res) => sendSuccess(res, { data: await fn(req.ctx) });

router.get('/overview', handle(service.overview));
router.get('/project-status', handle(service.projectStatus));
router.get('/tasks-summary', handle(service.tasksSummary));
router.get('/upcoming-posts', handle((ctx) => service.upcomingPosts(ctx)));
router.get('/production', async (req, res) => sendSuccess(res, { data: await service.production(req.ctx, { period: req.query.period }) }));
router.get('/financial-summary', requireStudioManager, handle(service.financialSummary));

export default router;
