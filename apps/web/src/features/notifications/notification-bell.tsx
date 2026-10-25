'use client';

import type { NotificationDTO } from '@taskflow/shared';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/format';
import { useMarkAllRead, useNotifications, useNotificationsRealtime } from './api';

function describe(notification: NotificationDTO): string {
  const p = notification.payload;
  switch (notification.type) {
    case 'task.assigned':
      return `You were assigned "${String(p.title)}"`;
    case 'comment.created':
      return `New comment on "${String(p.taskTitle)}"`;
    case 'project.member_added':
      return `You were added to ${String(p.projectName)}`;
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data } = useNotifications();
  const markAllRead = useMarkAllRead();
  useNotificationsRealtime();

  const unread = data?.unreadCount ?? 0;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications (${unread} unread)`}
        aria-expanded={open}
      >
        🔔
        {unread > 0 && (
          <span className="ml-1 rounded-full bg-red-600 px-1.5 text-xs text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <span className="text-sm font-semibold">Notifications</span>
            <Button
              variant="ghost"
              className="text-xs"
              onClick={() => markAllRead.mutate()}
              disabled={unread === 0 || markAllRead.isPending}
            >
              Mark all read
            </Button>
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {data?.items.length === 0 && (
              <li className="px-3 py-4 text-sm text-slate-500">You&apos;re all caught up.</li>
            )}
            {data?.items.map((n) => (
              <li
                key={n.id}
                className={`border-b border-slate-100 px-3 py-2 text-sm last:border-0 ${n.readAt ? '' : 'bg-indigo-50'}`}
              >
                <p>{describe(n)}</p>
                <p className="text-xs text-slate-500">{formatDateTime(n.createdAt)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
