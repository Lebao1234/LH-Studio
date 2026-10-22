import { Router } from 'express';
import { requireWriter } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { idParams } from '../../shared/utils/validators.js';
import * as ctrl from './task.controller.js';
import {
  assignmentParams,
  assignmentSchema,
  createTaskSchema,
  listTasksQuery,
  updateAssignmentSchema,
  updateTaskSchema,
} from './task.validation.js';

const router = Router();

router.get('/', validate({ query: listTasksQuery }), ctrl.list);
router.post('/', requireWriter, validate({ body: createTaskSchema }), ctrl.create);
router.get('/:id', validate({ params: idParams }), ctrl.get);
router.patch('/:id', requireWriter, validate({ params: idParams, body: updateTaskSchema }), ctrl.update);
router.delete('/:id', requireWriter, validate({ params: idParams }), ctrl.remove);

router.get('/:id/assignments', validate({ params: idParams }), ctrl.listAssignments);
router.post('/:id/assignments', requireWriter, validate({ params: idParams, body: assignmentSchema }), ctrl.addAssignment);
router.patch('/:id/assignments/:userId', requireWriter, validate({ params: assignmentParams, body: updateAssignmentSchema }), ctrl.updateAssignment);
router.delete('/:id/assignments/:userId', requireWriter, validate({ params: assignmentParams }), ctrl.removeAssignment);

export default router;
