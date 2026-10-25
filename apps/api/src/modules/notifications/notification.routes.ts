import { idSchema, listNotificationsQuerySchema } from '@taskflow/shared';
import { Router } from 'express';
import { z } from 'zod';
import { getUserId } from '../../middleware/auth';
import * as notificationService from './notification.service';

export const notificationRouter = Router();

notificationRouter.get('/', async (req, res) => {
  const query = listNotificationsQuerySchema.parse(req.query);
  res.json(await notificationService.list(getUserId(req), query));
});

notificationRouter.post('/read-all', async (req, res) => {
  await notificationService.markAllRead(getUserId(req));
  res.status(204).end();
});

notificationRouter.post('/:id/read', async (req, res) => {
  const { id } = z.object({ id: idSchema }).parse(req.params);
  await notificationService.markRead(getUserId(req), id);
  res.status(204).end();
});
