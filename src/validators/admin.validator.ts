import { z } from 'zod';
import { Role, UserStatus, CourseStatus, ReviewStatus } from '@prisma/client';

export const adminUsersQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  sort: z.enum(['created_at', 'full_name', 'email', 'last_login']).optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export const adminCoursesQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  sort: z.enum(['created_at', 'title', 'price']).optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  status: z.nativeEnum(CourseStatus).optional(),
  category: z.string().uuid().optional(),
  instructor: z.string().uuid().optional(),
});

export const adminReviewsQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  sort: z.enum(['created_at', 'rating']).optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  rating: z.coerce.number().min(1).max(5).optional(),
  status: z.nativeEnum(ReviewStatus).optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(Role).refine((role) => role !== Role.ADMIN, {
    message: "Cannot assign ADMIN role",
  }),
});

export const adminCreateUserSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.nativeEnum(Role).refine((role) => role !== Role.ADMIN, {
    message: 'Cannot assign ADMIN role during creation',
  }),
});

export const updateCourseStatusSchema = z.object({
  status: z.nativeEnum(CourseStatus),
});

export const updateReviewStatusSchema = z.object({
  status: z.nativeEnum(ReviewStatus),
});

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
});
