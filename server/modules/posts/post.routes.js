import { Router } from 'express';
import { requireWriter } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { idParams } from '../../shared/utils/validators.js';
import * as ctrl from './post.controller.js';
import { calendarQuery, createMetricSchema, createPostSchema, listPostsQuery, updatePostSchema } from './post.validation.js';

const router = Router();

router.get('/', validate({ query: listPostsQuery }), ctrl.list);
router.post('/', requireWriter, validate({ body: createPostSchema }), ctrl.create);
router.get('/:id', validate({ params: idParams }), ctrl.get);
router.patch('/:id', requireWriter, validate({ params: idParams, body: updatePostSchema }), ctrl.update);
router.delete('/:id', requireWriter, validate({ params: idParams }), ctrl.remove);

router.get('/:id/metrics', validate({ params: idParams }), ctrl.listMetrics);
router.post('/:id/metrics', requireWriter, validate({ params: idParams, body: createMetricSchema }), ctrl.addMetric);

/** Mounted at /calendar */
export const calendarRouter = Router();
calendarRouter.get('/', validate({ query: calendarQuery }), ctrl.calendar);

export default router;
