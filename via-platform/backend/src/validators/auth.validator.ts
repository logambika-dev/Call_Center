import { z } from 'zod';

export const registerSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1).max(255).optional(),
});

export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});
