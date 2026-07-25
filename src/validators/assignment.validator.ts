import { z } from 'zod';
import { AssignmentType, GradingType, AssignmentStatus } from '@prisma/client';

const attachmentSchema = z.object({
  url: z.string().url('Invalid URL format for attachment'),
  file_name: z.string().optional(),
  mime_type: z.string().optional(),
  size: z.number().int().positive().optional(),
});

export const createAssignmentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  type: z.nativeEnum(AssignmentType).optional(),
  grading_type: z.nativeEnum(GradingType).optional(),
  is_visible: z.boolean().optional(),
  available_from: z.string().datetime().optional().nullable(),
  due_date: z.string().datetime().optional().nullable(),
  time_limit_minutes: z.number().int().positive().optional().nullable(),
  total_marks: z.number().positive('Total marks must be greater than 0'),
  passing_marks: z.number().nonnegative('Passing marks cannot be negative'),
  allow_resubmission: z.boolean().optional(),
  max_attempts: z.number().int().positive().optional(),
  section_id: z.string().uuid('Invalid Section ID format').optional().nullable(),
  lesson_id: z.string().uuid('Invalid Lesson ID format').optional().nullable(),
  attachments: z.array(attachmentSchema).optional(),
}).refine((data) => data.passing_marks <= data.total_marks, {
  message: 'Passing marks cannot exceed total marks',
  path: ['passing_marks'],
});

export const updateAssignmentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters long').optional(),
  type: z.nativeEnum(AssignmentType).optional(),
  grading_type: z.nativeEnum(GradingType).optional(),
  status: z.nativeEnum(AssignmentStatus).optional(),
  is_visible: z.boolean().optional(),
  available_from: z.string().datetime().optional().nullable(),
  due_date: z.string().datetime().optional().nullable(),
  time_limit_minutes: z.number().int().positive().optional().nullable(),
  total_marks: z.number().positive().optional(),
  passing_marks: z.number().nonnegative().optional(),
  allow_resubmission: z.boolean().optional(),
  max_attempts: z.number().int().positive().optional(),
  section_id: z.string().uuid('Invalid Section ID format').optional().nullable(),
  lesson_id: z.string().uuid('Invalid Lesson ID format').optional().nullable(),
  attachments: z.array(attachmentSchema).optional(),
});

export const submitAssignmentSchema = z.object({
  content: z.string().optional(),
  attachments: z.array(attachmentSchema).optional(),
}).refine((data) => {
  const hasContent = data.content && data.content.trim().length > 0;
  const hasAttachments = data.attachments && data.attachments.length > 0;
  return hasContent || hasAttachments;
}, {
  message: 'Submission must include either text content or at least one attachment',
  path: ['content'],
});

export const gradeAssignmentSchema = z.object({
  score: z.number().nonnegative('Score must be at least 0'),
  feedback: z.string().optional(),
});

export const assignmentIdParamSchema = z.object({
  assignmentId: z.string().uuid('Invalid Assignment ID format'),
});

export const submissionIdParamSchema = z.object({
  submissionId: z.string().uuid('Invalid Submission ID format'),
});

export const courseIdParamSchema = z.object({
  courseId: z.string().uuid('Invalid Course ID format'),
});
