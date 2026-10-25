import { Router } from 'express';
import { requireAuth } from './middleware/auth';
import { createRateLimiter } from './middleware/rate-limit';
import { authRouter } from './modules/auth/auth.routes';
import { notificationRouter } from './modules/notifications/notification.routes';
import { projectRouter } from './modules/projects/project.routes';

export const apiRouter = Router();

apiRouter.use(createRateLimiter({ prefix: 'api', windowMs: 60_000, limit: 300 }));

apiRouter.use('/auth', authRouter);
apiRouter.use('/projects', requireAuth, projectRouter);
apiRouter.use('/notifications', requireAuth, notificationRouter);
