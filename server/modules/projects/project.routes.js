import { Router } from 'express';
import { requireWriter } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { idParams } from '../../shared/utils/validators.js';
import { projectEpisodesRouter } from '../episodes/episode.routes.js';
import * as ctrl from './project.controller.js';
import {
  createProjectSchema,
  listProjectsQuery,
  nextCodeQuery,
  projectMemberParams,
  projectMemberSchema,
  updateProjectSchema,
} from './project.validation.js';

const router = Router();

router.get('/', validate({ query: listProjectsQuery }), ctrl.list);
router.get('/next-code', validate({ query: nextCodeQuery }), ctrl.nextCode);
router.post('/', requireWriter, validate({ body: createProjectSchema }), ctrl.create);
router.get('/:id', validate({ params: idParams }), ctrl.get);
router.patch('/:id', requireWriter, validate({ params: idParams, body: updateProjectSchema }), ctrl.update);
router.delete('/:id', requireWriter, validate({ params: idParams }), ctrl.remove);

router.get('/:id/members', validate({ params: idParams }), ctrl.listMembers);
router.post('/:id/members', requireWriter, validate({ params: idParams, body: projectMemberSchema }), ctrl.addMember);
router.delete('/:id/members/:userId', requireWriter, validate({ params: projectMemberParams }), ctrl.removeMember);

router.use('/:projectId/episodes', projectEpisodesRouter);

export default router;
