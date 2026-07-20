import { z } from 'zod';

export const createLessonSchema = z.object({
  params: z.object({
    courseId: z.string().uuid('Invalid uuid format for courseId'),
    sectionId: z.string().uuid('Invalid uuid format for sectionId'),
  }),
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters long').max(150, 'Title cannot exceed 150 characters'),
    duration: z.number().int('Duration must be an integer').min(1, 'Duration must be at least 1 (minute/second)'),
    video_url: z.string().url('Invalid video URL format').optional(),
    is_free_preview: z.boolean().optional(),
    sequence_order: z.number().int('Sequence order must be an integer').min(1, 'Sequence order must be at least 1').optional(),
  }),
});

export const updateLessonSchema = z.object({
  params: z.object({
    courseId: z.string().uuid('Invalid uuid format for courseId'),
    sectionId: z.string().uuid('Invalid uuid format for sectionId'),
    lessonId: z.string().uuid('Invalid uuid format for lessonId'),
  }),
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters long').max(150, 'Title cannot exceed 150 characters').optional(),
    duration: z.number().int('Duration must be an integer').min(1, 'Duration must be at least 1 (minute/second)').optional(),
    video_url: z.string().url('Invalid video URL format').optional(),
    is_free_preview: z.boolean().optional(),
    sequence_order: z.number().int('Sequence order must be an integer').optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  }),
});

export const deleteLessonSchema = z.object({
  params: z.object({
    courseId: z.string().uuid('Invalid uuid format for courseId'),
    sectionId: z.string().uuid('Invalid uuid format for sectionId'),
    lessonId: z.string().uuid('Invalid uuid format for lessonId'),
  }),
});
