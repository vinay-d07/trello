import { z } from 'zod';

export const PROJECT_ROLES = ['OWNER', 'ADMIN', 'MEMBER'] as const;
export const projectRoleSchema = z.enum(PROJECT_ROLES);
export type ProjectRole = z.infer<typeof projectRoleSchema>;

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  description: z.string().trim().max(1000).optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const addMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  // OWNER is only assigned at project creation.
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});
export type AddMemberInput = z.infer<typeof addMemberSchema>;
