import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('Enter a valid email').max(254);

export const registerSchema = z.object({
  email,
  name: z.string().trim().min(1, 'Name is required').max(100),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required').max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;
