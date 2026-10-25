'use client';

import type { ProjectMemberDTO } from '@taskflow/shared';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { FormError, Input, Select } from '@/components/ui/input';
import { errorMessage } from '@/lib/api';
import { PRIORITY_LABELS } from '@/lib/format';
import { useCreateTask } from './api';

interface CreateTaskFormProps {
  projectId: string;
  members: ProjectMemberDTO[];
}

export function CreateTaskForm({ projectId, members }: CreateTaskFormProps) {
  const createTask = useCreateTask(projectId);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get('title') ?? '').trim();
    if (!title) {
      setError('Title is required');
      return;
    }
    setError(null);
    createTask.mutate(
      {
        title,
        priority: Number(data.get('priority')),
        assigneeId: (data.get('assigneeId') as string) || null,
      },
      { onSuccess: () => form.reset(), onError: (err) => setError(errorMessage(err)) },
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-wrap items-start gap-2 rounded-lg border border-slate-200 bg-white p-3"
    >
      <Input
        name="title"
        placeholder="What needs doing?"
        className="min-w-48 flex-1"
        maxLength={200}
      />
      <Select name="priority" defaultValue="1" className="w-32" aria-label="Priority">
        {PRIORITY_LABELS.map((label, value) => (
          <option key={label} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <Select name="assigneeId" defaultValue="" className="w-40" aria-label="Assignee">
        <option value="">Unassigned</option>
        {members.map(({ user }) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </Select>
      <Button type="submit" disabled={createTask.isPending}>
        Add task
      </Button>
      <div className="basis-full">
        <FormError message={error} />
      </div>
    </form>
  );
}
