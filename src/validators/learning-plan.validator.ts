import { z } from 'zod';

export const addCourseToPlanSchema = z.object({
  course_id: z.string().uuid('Invalid Course ID format'),
});

export const reorderLearningPlanSchema = z.object({
  ordered_course_ids: z.array(z.string().uuid('Invalid Course ID format'))
    .min(1, 'At least one course ID is required')
    .refine((items) => new Set(items).size === items.length, {
      message: 'Duplicate course IDs are not allowed in the reorder list',
    }),
});

export const courseIdParamSchema = z.object({
  courseId: z.string().uuid('Invalid Course ID format'),
});
