import { z } from 'zod';

export const ProgressValidator = {
  courseIdParam: z.object({
    courseId: z.string().uuid('Invalid uuid format for courseId'),
  }),
  lessonIdParam: z.object({
    lessonId: z.string().uuid('Invalid uuid format for lessonId'),
  }),
  watchPositionBody: z.object({
    watch_position: z.number().min(0, 'Watch position must be non-negative'),
  }),
};
