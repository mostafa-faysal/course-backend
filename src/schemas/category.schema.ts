import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long'),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid category ID format'),
  }),
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long').optional(),
  }),
});

export const getCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid category ID format'),
  }),
});
