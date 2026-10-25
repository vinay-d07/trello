import type { UserDTO } from '@taskflow/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => (await api<{ user: UserDTO }>('/auth/me')).user,
    staleTime: 5 * 60_000,
  });
}
