import { z } from 'zod';

export const updateProfileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  bio: z.string().max(500, 'Bio is too long').optional(),
  avatar_url: z.string().url('Invalid URL format').optional().or(z.literal(''))
});
