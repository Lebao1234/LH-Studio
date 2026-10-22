import { Router } from 'express';
import { requireWriter } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { idParams } from '../../shared/utils/validators.js';
import * as ctrl from './episode.controller.js';
import { createEpisodeSchema, listEpisodesQuery, projectParams, updateEpisodeSchema } from './episode.validation.js';

/** Mounted at /projects/:projectId/episodes */
export const projectEpisodesRouter = Router({ mergeParams: true });
projectEpisodesRouter.get('/', validate({ params: projectParams, query: listEpisodesQuery }), ctrl.listForProject);
projectEpisodesRouter.post('/', requireWriter, validate({ params: projectParams, body: createEpisodeSchema }), ctrl.createForProject);

/** Mounted at /episodes */
const router = Router();
router.get('/:id', validate({ params: idParams }), ctrl.get);
router.patch('/:id', requireWriter, validate({ params: idParams, body: updateEpisodeSchema }), ctrl.update);
router.delete('/:id', requireWriter, validate({ params: idParams }), ctrl.remove);

export default router;
