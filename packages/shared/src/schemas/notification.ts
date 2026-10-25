import { z } from 'zod';
import { paginationQuerySchema } from './common';

export const NOTIFICATION_TYPES = [
  'task.assigned',
  'comment.created',
  'project.member_added',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const listNotificationsQuerySchema = paginationQuerySchema.extend({
  unreadOnly: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
