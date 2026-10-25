import type { ListTasksQuery } from '@taskflow/shared';

/** Central query-key factory: keeps cache reads, writes and invalidations consistent. */
export const queryKeys = {
  me: ['me'] as const,
  projects: ['projects'] as const,
  project: (projectId: string) => ['projects', projectId] as const,
  tasks: (projectId: string) => ['projects', projectId, 'tasks'] as const,
  taskList: (projectId: string, filters: Partial<ListTasksQuery>) =>
    [...queryKeys.tasks(projectId), filters] as const,
  comments: (taskId: string) => ['tasks', taskId, 'comments'] as const,
  notifications: ['notifications'] as const,
};
