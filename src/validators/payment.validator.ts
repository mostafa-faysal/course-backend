import { z } from 'zod';

export const verifyPaymentSchema = z.object({
  body: z.object({
    orderId: z.string({ message: 'orderId is required' }).uuid('Invalid orderId format'),
    success: z.boolean({ message: 'success is required' }),
  }),
});
