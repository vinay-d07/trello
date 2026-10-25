import type { Notification } from '@prisma/client';
import type {
  ListNotificationsQuery,
  NotificationDTO,
  NotificationType,
  Paginated,
} from '@taskflow/shared';
import { prisma } from '../../lib/prisma';
import { cursorArgs, toPage } from '../../utils/pagination';

export const toNotificationDTO = (n: Notification): NotificationDTO => ({
  id: n.id,
  type: n.type as NotificationType,
  payload: (n.payload ?? {}) as Record<string, unknown>,
  readAt: n.readAt?.toISOString() ?? null,
  createdAt: n.createdAt.toISOString(),
});

export async function list(
  userId: string,
  query: ListNotificationsQuery,
): Promise<Paginated<NotificationDTO> & { unreadCount: number }> {
  const [rows, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId, readAt: query.unreadOnly ? null : undefined },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...cursorArgs(query.cursor, query.limit),
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  const page = toPage(rows, query.limit);
  return { items: page.items.map(toNotificationDTO), nextCursor: page.nextCursor, unreadCount };
}

/** Idempotent; scoped by userId so users can only touch their own notifications. */
export async function markRead(userId: string, notificationId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markAllRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
