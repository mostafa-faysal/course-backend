import { z } from 'zod';

export const createCourseSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'Title must be at least 5 characters long').max(200, 'Title is too long'),
    description: z.string().min(20, 'Description must be at least 20 characters long'),
    instructor_id: z.string().uuid('Invalid instructor ID'),
    category_id: z.string().uuid('Invalid category ID'),
    price: z.number().min(0, 'Price cannot be negative'),
    discount_price: z.number().min(0, 'Discount price cannot be negative').optional(),
    level: z.string().optional(),
    language: z.string().optional(),
    duration_hours: z.number().int('Duration hours must be an integer').min(0, 'Duration hours cannot be negative').optional(),
    duration_weeks: z.number().int('Duration weeks must be an integer').min(0, 'Duration weeks cannot be negative').optional(),
    projects_count: z.number().int('Projects count must be an integer').min(0, 'Projects count cannot be negative').optional(),
    requirements: z.array(z.string()).optional(),
    learning_outcomes: z.array(z.string()).optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN']).optional(),
    thumbnail: z.string().url('Invalid URL format for thumbnail').optional(),
    card_image: z.string().url('Invalid URL format for card image').optional(),
    cover_image: z.string().url('Invalid URL format for cover image').optional(),
    preview_video: z.string().url('Invalid URL format for preview video').optional(),
    preview_image: z.string().url('Invalid URL format for preview poster image').optional(),
  }),
});

export const getAllCoursesSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
    category_id: z.string().uuid('Invalid category ID').optional(),
    instructor_id: z.string().uuid('Invalid instructor ID').optional(),
    level: z.string().optional(),
    language: z.string().optional(),
    min_price: z.coerce.number().min(0, 'Price cannot be negative').optional(),
    max_price: z.coerce.number().min(0, 'Price cannot be negative').optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN']).optional(),
    sort_by: z.enum(['price', 'created_at', 'title', 'enrollments']).default('created_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
  }),
});
export const updateCourseSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid course ID'),
  }),
  body: z.object({
    title: z.string().min(5, 'Title must be at least 5 characters long').max(200, 'Title is too long').optional(),
    description: z.string().min(20, 'Description must be at least 20 characters long').optional(),
    category_id: z.string().uuid('Invalid category ID').optional(),
    price: z.number().min(0, 'Price cannot be negative').optional(),
    discount_price: z.number().min(0, 'Discount price cannot be negative').optional(),
    level: z.string().optional(),
    language: z.string().optional(),
    duration_hours: z.number().int('Duration hours must be an integer').min(0, 'Duration hours cannot be negative').optional(),
    duration_weeks: z.number().int('Duration weeks must be an integer').min(0, 'Duration weeks cannot be negative').optional(),
    projects_count: z.number().int('Projects count must be an integer').min(0, 'Projects count cannot be negative').optional(),
    requirements: z.array(z.string()).optional(),
    learning_outcomes: z.array(z.string()).optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN']).optional(),
    thumbnail: z.string().url('Invalid URL format for thumbnail').optional(),
    card_image: z.string().url('Invalid URL format for card image').optional(),
    cover_image: z.string().url('Invalid URL format for cover image').optional(),
    preview_video: z.string().url('Invalid URL format for preview video').optional(),
    preview_image: z.string().url('Invalid URL format for preview poster image').optional(),
  }),
});

export const deleteCourseSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid course ID'),
  }),
});

export const getCourseDetailsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid course ID'),
  }),
});


