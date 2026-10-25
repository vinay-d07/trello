import { z } from 'zod';
import { idSchema, paginationQuerySchema } from './common';

export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const;
export const taskStatusSchema = z.enum(TASK_STATUSES);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

/** 0 = low, 1 = medium, 2 = high, 3 = urgent */
export const taskPrioritySchema = z.number().int().min(0).max(3);

const title = z.string().trim().min(1, 'Title is required').max(200);
const description = z.string().trim().max(5000).nullable();
const assigneeId = idSchema.nullable();
const dueDate = z.coerce.date().nullable();

export const createTaskSchema = z.object({
  title,
  description: description.optional(),
  status: taskStatusSchema.default('TODO'),
  priority: taskPrioritySchema.default(1),
  assigneeId: assigneeId.optional(),
  dueDate: dueDate.optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z
  .object({
    title,
    description,
    status: taskStatusSchema,
    priority: taskPrioritySchema,
    assigneeId,
    dueDate,
  })
  .partial()
  .extend({
    /** Optimistic-concurrency token: the version the client last saw. */
    version: z.number().int().nonnegative(),
  });
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const listTasksQuerySchema = paginationQuerySchema.extend({
  status: taskStatusSchema.optional(),
  assigneeId: idSchema.optional(),
  q: z.string().trim().min(1).max(100).optional(),
});
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
