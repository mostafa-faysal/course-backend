import { z } from 'zod';

export const instructorPaginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
    course_id: z.string().uuid('Invalid course ID format').optional(),
    sort: z.string().default('created_at'),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export const instructorRevenueSchema = z.object({
  query: z.object({
    period: z.enum(['month', 'year', 'all']).default('all'),
  }),
});

export const instructorCourseStatsSchema = z.object({
  params: z.object({
    courseId: z.string().uuid('Invalid course ID'),
  }),
});

export const instructorRevokeStudentSchema = z.object({
  params: z.object({
    courseId: z.string().uuid('Invalid course ID'),
    studentId: z.string().uuid('Invalid student ID'),
  }),
});
