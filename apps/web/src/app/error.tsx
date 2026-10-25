'use client';

import { Button } from '@/components/ui/button';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md p-8 text-center">
      <h2 className="mb-2 text-lg font-semibold">Something went wrong</h2>
      <p className="mb-4 text-sm text-slate-600">The error has been logged. Try again.</p>
      <Button onClick={reset}>Retry</Button>
    </div>
  );
}
