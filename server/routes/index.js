import { Router } from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middlewares/authenticate.js';
import { studioContext } from '../middlewares/studioContext.js';
import { apiLimiter } from '../middlewares/rateLimiter.js';
import authRoutes from '../modules/auth/auth.routes.js';
import userRoutes from '../modules/users/user.routes.js';
import studioRoutes from '../modules/studios/studio.routes.js';
import projectRoutes from '../modules/projects/project.routes.js';
import episodeRoutes from '../modules/episodes/episode.routes.js';
import taskRoutes from '../modules/tasks/task.routes.js';
import channelRoutes from '../modules/channels/channel.routes.js';
import postRoutes, { calendarRouter } from '../modules/posts/post.routes.js';
import financeRoutes from '../modules/finances/finance.routes.js';
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js';
import storageRoutes from '../modules/storage/storage.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'ok', data: { db: mongoose.connection.readyState === 1 } });
});

router.use('/auth', authRoutes);

// Everything below requires a valid access token.
const protectedRouter = Router();
protectedRouter.use(authenticate, apiLimiter);
protectedRouter.use('/users', userRoutes);

// ...and an active studio membership; every service is scoped by req.ctx.studioId.
protectedRouter.use(studioContext);
protectedRouter.use('/storage', storageRoutes);
protectedRouter.use('/studios', studioRoutes);
protectedRouter.use('/projects', projectRoutes);
protectedRouter.use('/episodes', episodeRoutes);
protectedRouter.use('/tasks', taskRoutes);
protectedRouter.use('/channels', channelRoutes);
protectedRouter.use('/posts', postRoutes);
protectedRouter.use('/calendar', calendarRouter);
protectedRouter.use('/finance', financeRoutes);
protectedRouter.use('/dashboard', dashboardRoutes);

router.use(protectedRouter);

export default router;
