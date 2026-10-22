import { Router } from 'express';
import { requireStudioManager } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { idParams } from '../../shared/utils/validators.js';
import * as ctrl from './channel.controller.js';
import { createChannelSchema, listChannelsQuery, updateChannelSchema } from './channel.validation.js';

const router = Router();

router.get('/', validate({ query: listChannelsQuery }), ctrl.list);
router.post('/', requireStudioManager, validate({ body: createChannelSchema }), ctrl.create);
router.get('/:id', validate({ params: idParams }), ctrl.get);
router.patch('/:id', requireStudioManager, validate({ params: idParams, body: updateChannelSchema }), ctrl.update);
router.delete('/:id', requireStudioManager, validate({ params: idParams }), ctrl.remove);

export default router;
