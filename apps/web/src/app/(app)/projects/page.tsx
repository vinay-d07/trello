import { CreateProjectForm } from '@/features/projects/create-project-form';
import { ProjectList } from '@/features/projects/project-list';

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <CreateProjectForm />
      </div>
      <ProjectList />
    </div>
  );
}
