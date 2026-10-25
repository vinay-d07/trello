import type { ApiErrorBody } from '@taskflow/shared';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiOptions = Omit<RequestInit, 'body' | 'headers'> & {
  json?: unknown;
  headers?: Record<string, string>;
};

// Single-flight: many requests can 401 at once, but only one refresh should run.
let refreshInFlight: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  refreshInFlight ??= fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

function redirectToLogin() {
  if (typeof window === 'undefined') return;
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.assign(`/login?next=${next}`);
}

/** Browser-side fetch wrapper for the REST API (proxied via Next rewrites). */
export async function api<T>(path: string, options: ApiOptions = {}, canRetry = true): Promise<T> {
  const { json, headers, ...init } = options;
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });

  if (res.status === 401 && canRetry && !path.startsWith('/auth/')) {
    if (await refreshSession()) return api<T>(path, options, false);
    redirectToLogin();
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(
      res.status,
      body?.error.code ?? 'UNKNOWN',
      body?.error.message ?? res.statusText,
      body?.error.details,
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return 'Something went wrong. Please try again.';
}
