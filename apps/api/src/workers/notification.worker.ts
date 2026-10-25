import type { Prisma } from '@prisma/client';
import { SocketEvents } from '@taskflow/shared';
import { Worker } from 'bullmq';
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';
import { createRedis } from '../lib/redis';
import { toNotificationDTO } from '../modules/notifications/notification.service';
import { NOTIFICATION_QUEUE, type NotificationJobData } from '../queues/notification.queue';
import { emitToUser } from '../realtime/emitter';

export function createNotificationWorker(): Worker<NotificationJobData> {
  const worker = new Worker<NotificationJobData>(
    NOTIFICATION_QUEUE,
    async (job) => {
      const { userId, type, payload } = job.data;
      const notification = await prisma.notification.create({
        data: { userId, type, payload: payload as Prisma.InputJsonObject },
      });
      emitToUser(userId, SocketEvents.NOTIFICATION_CREATED, toNotificationDTO(notification));
    },
    {
      // Workers use blocking Redis commands: they need their own connection with no retry cap.
      connection: createRedis('worker-notifications', { maxRetriesPerRequest: null }),
      concurrency: 10,
    },
  );

  worker.on('failed', (job, err) =>
    logger.warn(
      { err, jobId: job?.id, attemptsMade: job?.attemptsMade },
      'notification job failed',
    ),
  );
  worker.on('error', (err) => logger.error({ err }, 'notification worker error'));

  return worker;
}
