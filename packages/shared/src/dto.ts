/**
 * Wire types: what the API returns as JSON. Dates are ISO strings.
 * The API maps DB rows to these explicitly so internal columns never leak.
 */
import type { NotificationType } from './schemas/notification';
import type { ProjectRole } from './schemas/project';
import type { TaskStatus } from './schemas/task';

export interface UserDTO {
  id: string;
  email: string;
  name: string;
}

export type UserRefDTO = Pick<UserDTO, 'id' | 'name'>;

export interface ProjectSummaryDTO {
  id: string;
  name: string;
  description: string | null;
  role: ProjectRole;
  memberCount: number;
  createdAt: string;
}

export interface ProjectMemberDTO {
  role: ProjectRole;
  user: UserDTO;
}

export interface ProjectDetailDTO {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  members: ProjectMemberDTO[];
}

export interface TaskDTO {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: number;
  dueDate: string | null;
  assigneeId: string | null;
  assignee: UserRefDTO | null;
  createdById: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommentDTO {
  id: string;
  taskId: string;
  body: string;
  author: UserRefDTO;
  createdAt: string;
}

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}
