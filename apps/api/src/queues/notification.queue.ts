import type { NotificationType } from '@taskflow/shared';
import { Queue } from 'bullmq';
import { logger } from '../lib/logger';
import { createRedis } from '../lib/redis';

export const NOTIFICATION_QUEUE = 'notifications';

export interface NotificationJobData {
  userId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
}

let queue: Queue<NotificationJobData> | undefined;

function getQueue(): Queue<NotificationJobData> {
  if (!queue) {
    queue = new Queue<NotificationJobData>(NOTIFICATION_QUEUE, {
      connection: createRedis('queue-notifications'),
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: { count: 1000, age: 24 * 3600 },
        removeOnFail: { age: 7 * 24 * 3600 },
      },
    });
    queue.on('error', (err) => logger.error({ err }, 'notification queue error'));
  }
  return queue;
}

/**
 * Best-effort: a notification must never fail the user's request.
 * Trade-off: if Redis is down after the DB write commits, the notification is
 * lost. The fix is the transactional outbox pattern (see Guide, Day 19).
 *
 * @param jobId deduplicates retries of the same logical event. Must not contain ':'.
 */
export async function enqueueNotification(
  data: NotificationJobData,
  jobId?: string,
): Promise<void> {
  try {
    await getQueue().add(data.type, data, { jobId });
  } catch (err) {
    logger.error({ err, type: data.type, userId: data.userId }, 'failed to enqueue notification');
  }
}

export async function closeQueues(): Promise<void> {
  await queue?.close();
}
