import type { CommentDTO, NotificationDTO, TaskDTO } from './dto';

export const SocketEvents = {
  PROJECT_JOIN: 'project:join',
  PROJECT_LEAVE: 'project:leave',
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
  COMMENT_CREATED: 'comment:created',
  NOTIFICATION_CREATED: 'notification:created',
} as const;

export const rooms = {
  project: (projectId: string) => `project:${projectId}`,
  user: (userId: string) => `user:${userId}`,
};

export type AckResponse = { ok: true } | { ok: false; error: string };

export interface ServerToClientEvents {
  'task:created': (task: TaskDTO) => void;
  'task:updated': (task: TaskDTO) => void;
  'task:deleted': (payload: { id: string; projectId: string }) => void;
  'comment:created': (comment: CommentDTO & { projectId: string }) => void;
  'notification:created': (notification: NotificationDTO) => void;
}

export interface ClientToServerEvents {
  'project:join': (projectId: string, ack?: (res: AckResponse) => void) => void;
  'project:leave': (projectId: string) => void;
}
