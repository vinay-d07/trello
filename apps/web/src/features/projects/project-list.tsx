'use client';

import Link from 'next/link';
import { errorMessage } from '@/lib/api';
import { useProjects } from './api';

export function ProjectList() {
  const { data: projects, isPending, error } = useProjects();

  if (isPending) return <p className="text-sm text-slate-500">Loading projects…</p>;
  if (error) return <p className="text-sm text-red-600">{errorMessage(error)}</p>;
  if (projects.length === 0) {
    return <p className="text-sm text-slate-500">No projects yet. Create your first one.</p>;
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <li key={project.id}>
          <Link
            href={`/projects/${project.id}`}
            className="block rounded-lg border border-slate-200 bg-white p-4 transition hover:border-indigo-300 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-medium">{project.name}</h2>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                {project.role.toLowerCase()}
              </span>
            </div>
            {project.description && (
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{project.description}</p>
            )}
            <p className="mt-3 text-xs text-slate-500">
              {project.memberCount} member{project.memberCount === 1 ? '' : 's'}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
