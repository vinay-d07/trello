import type { Prisma } from '@prisma/client';
import {
  SocketEvents,
  type CreateTaskInput,
  type ListTasksQuery,
  type Paginated,
  type TaskDTO,
  type UpdateTaskInput,
} from '@taskflow/shared';
import { prisma } from '../../lib/prisma';
import { enqueueNotification } from '../../queues/notification.queue';
import { emitToProject } from '../../realtime/emitter';
import { AppError } from '../../utils/app-error';
import { cursorArgs, toPage } from '../../utils/pagination';
import { assertMember } from '../projects/project.service';

const taskInclude = {
  assignee: { select: { id: true, name: true } },
} satisfies Prisma.TaskInclude;

type TaskRow = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

export function toTaskDTO(task: TaskRow): TaskDTO {
  return {
    id: task.id,
    projectId: task.projectId,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate?.toISOString() ?? null,
    assigneeId: task.assigneeId,
    assignee: task.assignee,
    createdById: task.createdById,
    version: task.version,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

async function assertAssignable(projectId: string, assigneeId: string | null | undefined) {
  if (!assigneeId) return;
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: assigneeId } },
    select: { userId: true },
  });
  if (!membership) throw AppError.badRequest('Assignee must be a member of the project');
}

async function notifyAssignee(task: TaskRow, actorId: string) {
  if (!task.assigneeId || task.assigneeId === actorId) return;
  await enqueueNotification(
    {
      userId: task.assigneeId,
      type: 'task.assigned',
      payload: {
        taskId: task.id,
        projectId: task.projectId,
        title: task.title,
        assignedById: actorId,
      },
    },
    `task-assigned-${task.id}-v${task.version}`,
  );
}

export async function list(
  projectId: string,
  userId: string,
  query: ListTasksQuery,
): Promise<Paginated<TaskDTO>> {
  await assertMember(projectId, userId);

  // Prisma ignores `undefined` filters, so optional query params just drop out.
  const where: Prisma.TaskWhereInput = {
    projectId,
    status: query.status,
    assigneeId: query.assigneeId,
    title: query.q ? { contains: query.q, mode: 'insensitive' } : undefined,
  };

  const rows = await prisma.task.findMany({
    where,
    include: taskInclude,
    // `id` breaks ties so keyset pagination is stable.
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    ...cursorArgs(query.cursor, query.limit),
  });

  const page = toPage(rows, query.limit);
  return { items: page.items.map(toTaskDTO), nextCursor: page.nextCursor };
}

export async function create(
  projectId: string,
  userId: string,
  input: CreateTaskInput,
): Promise<TaskDTO> {
  await assertMember(projectId, userId);
  await assertAssignable(projectId, input.assigneeId);

  // Fields are listed explicitly (no `...input`) to rule out mass assignment.
  const task = await prisma.task.create({
    data: {
      projectId,
      createdById: userId,
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      assigneeId: input.assigneeId,
      dueDate: input.dueDate,
    },
    include: taskInclude,
  });

  const dto = toTaskDTO(task);
  emitToProject(projectId, SocketEvents.TASK_CREATED, dto);
  await notifyAssignee(task, userId);
  return dto;
}

export async function update(
  projectId: string,
  taskId: string,
  userId: string,
  input: UpdateTaskInput,
): Promise<TaskDTO> {
  await assertMember(projectId, userId);
  await assertAssignable(projectId, input.assigneeId);

  const before = await prisma.task.findFirst({
    where: { id: taskId, projectId },
    select: { assigneeId: true },
  });
  if (!before) throw AppError.notFound('Task not found');

  // Optimistic concurrency: only apply if nobody else updated the task since the client read it.
  const { count } = await prisma.task.updateMany({
    where: { id: taskId, projectId, version: input.version },
    data: {
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      assigneeId: input.assigneeId,
      dueDate: input.dueDate,
      version: { increment: 1 },
    },
  });
  if (count === 0) {
    throw AppError.conflict('This task was changed by someone else. Refresh and try again.');
  }

  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId }, include: taskInclude });
  const dto = toTaskDTO(task);
  emitToProject(projectId, SocketEvents.TASK_UPDATED, dto);
  if (task.assigneeId !== before.assigneeId) await notifyAssignee(task, userId);
  return dto;
}

export async function remove(projectId: string, taskId: string, userId: string): Promise<void> {
  await assertMember(projectId, userId);
  const { count } = await prisma.task.deleteMany({ where: { id: taskId, projectId } });
  if (count === 0) throw AppError.notFound('Task not found');
  emitToProject(projectId, SocketEvents.TASK_DELETED, { id: taskId, projectId });
}
