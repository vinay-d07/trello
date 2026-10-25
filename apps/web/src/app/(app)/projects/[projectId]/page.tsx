import { ProjectBoard } from '@/features/tasks/project-board';

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <ProjectBoard projectId={projectId} />;
}
