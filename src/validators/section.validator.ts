import { z } from 'zod';

export const createSectionSchema = z.object({
  params: z.object({
    courseId: z.string().uuid('Invalid uuid format for courseId'),
  }),
  body: z.object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters long').max(150, 'Title is too long'),
    sequence_order: z.number().int().min(1).optional(),
  }),
});

export const updateSectionSchema = z.object({
  params: z.object({
    courseId: z.string().uuid('Invalid uuid format for courseId'),
    sectionId: z.string().uuid('Invalid uuid format for sectionId'),
  }),
  body: z.object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters long').max(150, 'Title is too long').optional(),
    sequence_order: z.number().int().min(1).optional(),
  }).refine(data => data.title !== undefined || data.sequence_order !== undefined, {
    message: 'At least one field (title or sequence_order) must be provided to update',
  }),
});

export const deleteSectionSchema = z.object({
  params: z.object({
    courseId: z.string().uuid('Invalid uuid format for courseId'),
    sectionId: z.string().uuid('Invalid uuid format for sectionId'),
  }),
});
