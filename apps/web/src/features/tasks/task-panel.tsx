'use client';

import {
  TASK_STATUSES,
  type ProjectMemberDTO,
  type TaskDTO,
  type TaskStatus,
} from '@taskflow/shared';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { FormError, Select, Textarea } from '@/components/ui/input';
import { errorMessage } from '@/lib/api';
import { formatDateTime, STATUS_LABELS } from '@/lib/format';
import { useComments, useCreateComment, useDeleteTask, useUpdateTask } from './api';

interface TaskPanelProps {
  projectId: string;
  task: TaskDTO;
  members: ProjectMemberDTO[];
  onClose: () => void;
}

export function TaskPanel({ projectId, task, members, onClose }: TaskPanelProps) {
  const updateTask = useUpdateTask(projectId);
  const deleteTask = useDeleteTask(projectId);

  function update(changes: { status?: TaskStatus; assigneeId?: string | null }) {
    // Send the version we rendered so the server can reject lost updates (409).
    updateTask.mutate({ taskId: task.id, version: task.version, ...changes });
  }

  function remove() {
    if (!window.confirm('Delete this task?')) return;
    deleteTask.mutate(task.id, { onSuccess: onClose });
  }

  return (
    <aside className="w-full max-w-sm shrink-0 space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-semibold">{task.title}</h2>
        <Button variant="ghost" onClick={onClose} aria-label="Close panel">
          ✕
        </Button>
      </div>
      {task.description && (
        <p className="text-sm whitespace-pre-wrap text-slate-700">{task.description}</p>
      )}

      <div className="grid grid-cols-2 gap-2 text-sm">
        <label className="space-y-1">
          <span className="text-slate-600">Status</span>
          <Select
            value={task.status}
            onChange={(e) => update({ status: e.target.value as TaskStatus })}
            disabled={updateTask.isPending}
          >
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1">
          <span className="text-slate-600">Assignee</span>
          <Select
            value={task.assigneeId ?? ''}
            onChange={(e) => update({ assigneeId: e.target.value || null })}
            disabled={updateTask.isPending}
          >
            <option value="">Unassigned</option>
            {members.map(({ user }) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
        </label>
      </div>
      <FormError message={updateTask.error ? errorMessage(updateTask.error) : null} />

      <TaskComments projectId={projectId} taskId={task.id} />

      <Button variant="danger" onClick={remove} disabled={deleteTask.isPending}>
        Delete task
      </Button>
    </aside>
  );
}

function TaskComments({ projectId, taskId }: { projectId: string; taskId: string }) {
  const comments = useComments(projectId, taskId);
  const createComment = useCreateComment(projectId, taskId);
  const [body, setBody] = useState('');

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    createComment.mutate(trimmed, { onSuccess: () => setBody('') });
  }

  return (
    <section className="space-y-3 border-t border-slate-200 pt-4">
      <h3 className="text-sm font-semibold">Comments</h3>
      {comments.isPending && <p className="text-sm text-slate-500">Loading…</p>}
      <ul className="max-h-72 space-y-3 overflow-y-auto">
        {comments.data?.items.map((comment) => (
          <li key={comment.id} className="text-sm">
            <p>
              <span className="font-medium">{comment.author.name}</span>{' '}
              <span className="text-xs text-slate-500">{formatDateTime(comment.createdAt)}</span>
            </p>
            {/* Rendered as text, never as HTML: comments are user input. */}
            <p className="whitespace-pre-wrap text-slate-700">{comment.body}</p>
          </li>
        ))}
      </ul>
      <form onSubmit={onSubmit} className="space-y-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Write a comment"
          maxLength={5000}
        />
        <FormError message={createComment.error ? errorMessage(createComment.error) : null} />
        <Button type="submit" disabled={createComment.isPending || !body.trim()}>
          Comment
        </Button>
      </form>
    </section>
  );
}
