import type { Prisma } from '@prisma/client';
import {
  SocketEvents,
  type CommentDTO,
  type CreateCommentInput,
  type Paginated,
  type PaginationQuery,
} from '@taskflow/shared';
import { prisma } from '../../lib/prisma';
import { enqueueNotification } from '../../queues/notification.queue';
import { emitToProject } from '../../realtime/emitter';
import { AppError } from '../../utils/app-error';
import { cursorArgs, toPage } from '../../utils/pagination';
import { assertMember } from '../projects/project.service';

const commentInclude = {
  author: { select: { id: true, name: true } },
} satisfies Prisma.CommentInclude;

type CommentRow = Prisma.CommentGetPayload<{ include: typeof commentInclude }>;

const toCommentDTO = (comment: CommentRow): CommentDTO => ({
  id: comment.id,
  taskId: comment.taskId,
  body: comment.body,
  author: comment.author,
  createdAt: comment.createdAt.toISOString(),
});

async function findTaskInProject(projectId: string, taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId },
    select: { id: true, title: true, assigneeId: true, createdById: true },
  });
  if (!task) throw AppError.notFound('Task not found');
  return task;
}

export async function list(
  projectId: string,
  taskId: string,
  userId: string,
  query: PaginationQuery,
): Promise<Paginated<CommentDTO>> {
  await assertMember(projectId, userId);
  await findTaskInProject(projectId, taskId);

  const rows = await prisma.comment.findMany({
    where: { taskId },
    include: commentInclude,
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    ...cursorArgs(query.cursor, query.limit),
  });
  const page = toPage(rows, query.limit);
  return { items: page.items.map(toCommentDTO), nextCursor: page.nextCursor };
}

export async function create(
  projectId: string,
  taskId: string,
  userId: string,
  input: CreateCommentInput,
): Promise<CommentDTO> {
  await assertMember(projectId, userId);
  const task = await findTaskInProject(projectId, taskId);

  const comment = await prisma.comment.create({
    data: { taskId, authorId: userId, body: input.body },
    include: commentInclude,
  });
  const dto = toCommentDTO(comment);
  emitToProject(projectId, SocketEvents.COMMENT_CREATED, { ...dto, projectId });

  const recipients = new Set(
    [task.assigneeId, task.createdById].filter((id): id is string => !!id && id !== userId),
  );
  await Promise.all(
    [...recipients].map((recipientId) =>
      enqueueNotification(
        {
          userId: recipientId,
          type: 'comment.created',
          payload: {
            projectId,
            taskId,
            taskTitle: task.title,
            commentId: comment.id,
            authorId: userId,
          },
        },
        `comment-${comment.id}-${recipientId}`,
      ),
    ),
  );

  return dto;
}
