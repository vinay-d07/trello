'use client';

import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMe } from '@/features/auth/api';
import { NotificationBell } from '@/features/notifications/notification-bell';
import { api } from '@/lib/api';
import { disconnectSocket } from '@/lib/socket';
import { Button } from './ui/button';

export function AppHeader() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me } = useMe();

  async function logout() {
    await api('/auth/logout', { method: 'POST' });
    disconnectSocket();
    queryClient.clear(); // never show the previous user's cached data
    router.replace('/login');
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/projects" className="font-semibold text-indigo-600">
          TaskFlow
        </Link>
        <div className="flex items-center gap-3">
          {me && <span className="hidden text-sm text-slate-600 sm:inline">{me.name}</span>}
          <NotificationBell />
          <Button variant="ghost" onClick={logout}>
            Log out
          </Button>
        </div>
      </div>
    </header>
  );
}
