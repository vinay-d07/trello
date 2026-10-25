import type {
  AddMemberInput,
  CreateProjectInput,
  ProjectDetailDTO,
  ProjectMemberDTO,
  ProjectSummaryDTO,
} from '@taskflow/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: async () => (await api<{ items: ProjectSummaryDTO[] }>('/projects')).items,
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => api<ProjectDetailDTO>(`/projects/${projectId}`),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectInput) =>
      api<ProjectSummaryDTO>('/projects', { method: 'POST', json: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
  });
}

export function useAddMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddMemberInput) =>
      api<ProjectMemberDTO>(`/projects/${projectId}/members`, { method: 'POST', json: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) }),
  });
}
