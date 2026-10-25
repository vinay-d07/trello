import { z } from 'zod';

export const idSchema = z.string().min(1).max(64);

export const paginationQuerySchema = z.object({
  cursor: idSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}
