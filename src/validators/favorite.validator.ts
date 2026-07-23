import { z } from 'zod';

export const FavoriteValidator = {
  courseIdParam: z.object({
    courseId: z.string().uuid('Invalid course ID format'),
  }),
};
