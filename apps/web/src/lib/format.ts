const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export const formatDateTime = (iso: string) => dateFormatter.format(new Date(iso));

export const PRIORITY_LABELS = ['Low', 'Medium', 'High', 'Urgent'] as const;

export const STATUS_LABELS = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  IN_REVIEW: 'In review',
  DONE: 'Done',
} as const;

/** Only allow same-origin relative paths, to prevent open redirects via ?next=. */
export function safeRedirectPath(next: string | undefined, fallback = '/projects'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return fallback;
  }
  return next;
}
