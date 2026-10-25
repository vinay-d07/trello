'use client';

import { TASK_STATUSES, type TaskDTO, type TaskStatus } from '@taskflow/shared';
import { useMemo, useState } from 'react';
import { errorMessage } from '@/lib/api';
import { STATUS_LABELS } from '@/lib/format';
import { useProject } from '../projects/api';
import { useTasks } from './api';
import { CreateTaskForm } from './create-task-form';
import { TaskCard } from './task-card';
import { TaskPanel } from './task-panel';
import { useProjectRealtime } from './use-project-realtime';

const BOARD_PAGE_SIZE = 100;

export function ProjectBoard({ projectId }: { projectId: string }) {
  const project = useProject(projectId);
  const tasks = useTasks(projectId, { limit: BOARD_PAGE_SIZE });
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  useProjectRealtime(projectId);

  const columns = useMemo(() => {
    const grouped = Object.fromEntries(TASK_STATUSES.map((s) => [s, [] as TaskDTO[]])) as Record<
      TaskStatus,
      TaskDTO[]
    >;
    for (const task of tasks.data?.items ?? []) grouped[task.status].push(task);
    return grouped;
  }, [tasks.data]);

  const selectedTask = tasks.data?.items.find((t) => t.id === selectedTaskId) ?? null;

  if (project.isPending) return <p className="text-sm text-slate-500">Loading project…</p>;
  if (project.error) return <p className="text-sm text-red-600">{errorMessage(project.error)}</p>;

  const members = project.data.members;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{project.data.name}</h1>
        {project.data.description && (
          <p className="mt-1 text-sm text-slate-600">{project.data.description}</p>
        )}
      </div>

      <CreateTaskForm projectId={projectId} members={members} />

      {tasks.error && <p className="text-sm text-red-600">{errorMessage(tasks.error)}</p>}
      {tasks.data?.nextCursor && (
        <p className="text-xs text-amber-700">Showing the newest {BOARD_PAGE_SIZE} tasks only.</p>
      )}

      <div className="flex gap-6">
        <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {TASK_STATUSES.map((status) => (
            <section key={status} className="rounded-lg bg-slate-100 p-3">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">
                {STATUS_LABELS[status]}{' '}
                <span className="font-normal text-slate-500">({columns[status].length})</span>
              </h2>
              <ul className="space-y-2">
                {columns[status].map((task) => (
                  <li key={task.id}>
                    <TaskCard
                      task={task}
                      selected={task.id === selectedTaskId}
                      onSelect={() => setSelectedTaskId(task.id)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {selectedTask && (
          <TaskPanel
            projectId={projectId}
            task={selectedTask}
            members={members}
            onClose={() => setSelectedTaskId(null)}
          />
        )}
      </div>
    </div>
  );
}
