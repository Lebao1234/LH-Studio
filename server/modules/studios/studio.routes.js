import { Router } from 'express';
import { requireStudioManager } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { idParams } from '../../shared/utils/validators.js';
import * as ctrl from './studio.controller.js';
import { addMemberSchema, listMembersQuery, memberParams, updateMemberSchema, updateStudioSchema } from './studio.validation.js';

const router = Router();

router.get('/current', ctrl.getCurrent);
router.patch('/current', requireStudioManager, validate({ body: updateStudioSchema }), ctrl.updateCurrent);

router.get('/current/members', validate({ query: listMembersQuery }), ctrl.listMembers);
router.post('/current/members', requireStudioManager, validate({ body: addMemberSchema }), ctrl.addMember);
router.patch('/current/members/:id', requireStudioManager, validate({ params: memberParams, body: updateMemberSchema }), ctrl.updateMember);
router.delete('/current/members/:id', requireStudioManager, validate({ params: memberParams }), ctrl.removeMember);

router.get('/current/invitations', requireStudioManager, ctrl.listInvitations);
router.delete('/current/invitations/:id', requireStudioManager, validate({ params: idParams }), ctrl.revokeInvitation);

export default router;
