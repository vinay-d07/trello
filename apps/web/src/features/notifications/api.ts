import { SocketEvents, type NotificationDTO, type Paginated } from '@taskflow/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { getSocket } from '@/lib/socket';

type NotificationPage = Paginated<NotificationDTO> & { unreadCount: number };

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => api<NotificationPage>('/notifications?limit=20'),
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>('/notifications/read-all', { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}

/** The server always puts each socket in its user room, so no join is needed. */
export function useNotificationsRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    const refresh = () => void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    socket.on(SocketEvents.NOTIFICATION_CREATED, refresh);
    return () => {
      socket.off(SocketEvents.NOTIFICATION_CREATED, refresh);
    };
  }, [queryClient]);
}
