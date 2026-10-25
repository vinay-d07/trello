'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ApiError } from '@/lib/api';

const MAX_RETRIES = 2;

export function Providers({ children }: { children: ReactNode }) {
  // useState (not a module-level client) so each request/render tree gets its own cache.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            // Client errors (4xx) won't fix themselves; only retry network/5xx failures.
            retry: (failureCount, error) =>
              !(error instanceof ApiError && error.status < 500) && failureCount < MAX_RETRIES,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
