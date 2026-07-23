import { z } from 'zod';

export class CartValidator {
  static addItemSchema = z.object({
    body: z.object({
      courseId: z.string().uuid({ message: 'Invalid course ID format' }),
    }),
  });

  static removeItemSchema = z.object({
    params: z.object({
      courseId: z.string().uuid({ message: 'Invalid course ID format' }),
    }),
  });
}
