import { Router } from 'express';
import { EnrollmentController } from '../controllers/enrollment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { z } from 'zod';
import { EnrollmentValidator } from '../validators/enrollment.validator';

const router = Router();

// Student Routes
router.get(
  '/enrollments/my-courses',
  authenticate,
  authorize('STUDENT', 'INSTRUCTOR', 'ADMIN'), // Allow any role to have enrolled courses if needed, but primary is student
  EnrollmentController.getMyCourses
);

// We attach enroll route to /api/v1/courses/:courseId/enroll 
// It's technically under the courses resource conceptually, but managed by enrollment router.
// We'll export it and mount it at /api/v1/courses directly or use /api/v1/enrollments depending on structure.
// I will export this router and we will mount it at /api/v1

// Enroll in a course
router.post(
  '/courses/:courseId/enroll',
  authenticate,
  validate(z.object({ params: EnrollmentValidator.courseIdParam })),
  EnrollmentController.enrollStudent
);

// Instructor/Admin Routes for Stats
router.get(
  '/courses/:courseId/enrollments/stats',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN'),
  validate(z.object({ params: EnrollmentValidator.courseIdParam })),
  EnrollmentController.getCourseEnrollmentStats
);

export default router;
