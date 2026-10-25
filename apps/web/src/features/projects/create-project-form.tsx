'use client';

import { createProjectSchema } from '@taskflow/shared';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { FormError, Input } from '@/components/ui/input';
import { errorMessage } from '@/lib/api';
import { useCreateProject } from './api';

export function CreateProjectForm() {
  const createProject = useCreateProject();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const parsed = createProjectSchema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }
    setError(null);
    createProject.mutate(parsed.data, {
      onSuccess: () => form.reset(),
      onError: (err) => setError(errorMessage(err)),
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-start gap-2">
      <Input name="name" placeholder="New project name" className="w-56" maxLength={100} />
      <Button type="submit" disabled={createProject.isPending}>
        Create
      </Button>
      <div className="basis-full">
        <FormError message={error} />
      </div>
    </form>
  );
}
