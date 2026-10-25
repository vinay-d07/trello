import type {
  CommentDTO,
  CreateTaskInput,
  ListTasksQuery,
  Paginated,
  TaskDTO,
  UpdateTaskInput,
} from '@taskflow/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

function toSearchParams(filters: Partial<ListTasksQuery>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function useTasks(projectId: string, filters: Partial<ListTasksQuery> = {}) {
  return useQuery({
    queryKey: queryKeys.taskList(projectId, filters),
    queryFn: () =>
      api<Paginated<TaskDTO>>(`/projects/${projectId}/tasks${toSearchParams(filters)}`),
  });
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreateTaskInput> & { title: string }) =>
      api<TaskDTO>(`/projects/${projectId}/tasks`, { method: 'POST', json: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks(projectId) }),
  });
}

export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, ...input }: UpdateTaskInput & { taskId: string }) =>
      api<TaskDTO>(`/projects/${projectId}/tasks/${taskId}`, { method: 'PATCH', json: input }),
    // Invalidate on error too: a 409 means our copy is stale.
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks(projectId) }),
  });
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      api<void>(`/projects/${projectId}/tasks/${taskId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks(projectId) }),
  });
}

export function useComments(projectId: string, taskId: string) {
  return useQuery({
    queryKey: queryKeys.comments(taskId),
    queryFn: () =>
      api<Paginated<CommentDTO>>(`/projects/${projectId}/tasks/${taskId}/comments?limit=100`),
  });
}

export function useCreateComment(projectId: string, taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      api<CommentDTO>(`/projects/${projectId}/tasks/${taskId}/comments`, {
        method: 'POST',
        json: { body },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.comments(taskId) }),
  });
}
