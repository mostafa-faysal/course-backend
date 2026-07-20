import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid course ID format'),
  }),
});

export const updateReviewSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid course ID format'),
    reviewId: z.string().uuid('Invalid review ID format'),
  }),
  body: z.object({
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().optional(),
  }).refine((data) => data.rating !== undefined || data.comment !== undefined, {
    message: 'Either rating or comment must be provided for update',
  }),
});

export const getCourseReviewsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid course ID format'),
  }),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }).optional(),
});

export const deleteReviewSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid course ID format'),
    reviewId: z.string().uuid('Invalid review ID format'),
  }),
});

export const getRatingSummarySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid course ID format'),
  }),
});
