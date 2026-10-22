import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requireCsrfHeader } from '../../middlewares/csrf.js';
import { loginAccountLimiter, loginIpLimiter, passwordChangeLimiter, refreshLimiter, registerLimiter } from '../../middlewares/rateLimiter.js';
import * as ctrl from './auth.controller.js';
import { changePasswordSchema, invitationTokenParams, loginSchema, registerSchema } from './auth.validation.js';

const router = Router();

router.get('/registration-status', ctrl.registrationStatus);
router.get('/invitations/:token', registerLimiter, validate({ params: invitationTokenParams }), ctrl.previewInvitation);

router.post('/register', registerLimiter, requireCsrfHeader, validate({ body: registerSchema }), ctrl.register);
router.post('/login', loginIpLimiter, loginAccountLimiter, requireCsrfHeader, validate({ body: loginSchema }), ctrl.login);
router.post('/refresh', refreshLimiter, requireCsrfHeader, ctrl.refresh);
router.post('/logout', requireCsrfHeader, ctrl.logout);

router.get('/me', authenticate, ctrl.me);
router.post('/change-password', authenticate, passwordChangeLimiter, validate({ body: changePasswordSchema }), ctrl.changePassword);

export default router;
