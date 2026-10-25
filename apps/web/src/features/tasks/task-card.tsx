import type { TaskDTO } from '@taskflow/shared';
import { PRIORITY_LABELS } from '@/lib/format';

const PRIORITY_STYLES = [
  'bg-slate-100 text-slate-600',
  'bg-blue-100 text-blue-700',
  'bg-amber-100 text-amber-800',
  'bg-red-100 text-red-700',
];

interface TaskCardProps {
  task: TaskDTO;
  selected: boolean;
  onSelect: () => void;
}

export function TaskCard({ task, selected, onSelect }: TaskCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-md border bg-white p-3 text-left text-sm shadow-sm transition hover:border-indigo-300 ${
        selected ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200'
      }`}
    >
      <p className="font-medium">{task.title}</p>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <span className={`rounded px-1.5 py-0.5 ${PRIORITY_STYLES[task.priority] ?? ''}`}>
          {PRIORITY_LABELS[task.priority] ?? task.priority}
        </span>
        <span className="truncate text-slate-500">{task.assignee?.name ?? 'Unassigned'}</span>
      </div>
    </button>
  );
}
