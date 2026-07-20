import { z } from 'zod';

export const EnrollmentValidator = {
  courseIdParam: z.object({
    courseId: z.string().uuid('Invalid uuid format for courseId'),
  }),
};
