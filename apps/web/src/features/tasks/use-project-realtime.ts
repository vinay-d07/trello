'use client';

import { SocketEvents, type CommentDTO } from '@taskflow/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { queryKeys } from '@/lib/query-keys';
import { getSocket } from '@/lib/socket';

/**
 * Subscribes to a project's room and keeps React Query caches fresh.
 * Every listener registered here is removed in the cleanup — leaking
 * listeners on navigation is one of the most common realtime bugs.
 */
export function useProjectRealtime(projectId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();

    const join = () => {
      socket.emit(SocketEvents.PROJECT_JOIN, projectId, (res) => {
        if (!res.ok) console.warn(`Realtime unavailable for project: ${res.error}`);
      });
    };
    const refreshTasks = () =>
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks(projectId) });
    const refreshComments = (comment: CommentDTO) =>
      void queryClient.invalidateQueries({ queryKey: queryKeys.comments(comment.taskId) });

    if (socket.connected) join();
    // Rooms are per-connection: re-join after every reconnect.
    socket.on('connect', join);
    socket.on(SocketEvents.TASK_CREATED, refreshTasks);
    socket.on(SocketEvents.TASK_UPDATED, refreshTasks);
    socket.on(SocketEvents.TASK_DELETED, refreshTasks);
    socket.on(SocketEvents.COMMENT_CREATED, refreshComments);

    return () => {
      socket.emit(SocketEvents.PROJECT_LEAVE, projectId);
      socket.off('connect', join);
      socket.off(SocketEvents.TASK_CREATED, refreshTasks);
      socket.off(SocketEvents.TASK_UPDATED, refreshTasks);
      socket.off(SocketEvents.TASK_DELETED, refreshTasks);
      socket.off(SocketEvents.COMMENT_CREATED, refreshComments);
    };
  }, [projectId, queryClient]);
}
