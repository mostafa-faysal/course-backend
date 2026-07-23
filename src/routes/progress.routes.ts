import { Router } from 'express';
import { ProgressController } from '../controllers/progress.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { z } from 'zod';
import { ProgressValidator } from '../validators/progress.validator';

const router = Router({ mergeParams: true });

// Note: These routes are expected to be mounted at:
// /api/courses/:courseId/progress

// Get overall course progress
router.get(
  '/',
  authenticate,
  authorize('STUDENT'),
  validate(z.object({ params: ProgressValidator.courseIdParam })),
  ProgressController.getCourseProgress
);

// Mark lesson complete
router.post(
  '/lessons/:lessonId/complete',
  authenticate,
  authorize('STUDENT'),
  validate(z.object({
    params: ProgressValidator.courseIdParam.merge(ProgressValidator.lessonIdParam)
  })),
  ProgressController.markLessonComplete
);

// Mark lesson incomplete
router.delete(
  '/lessons/:lessonId/complete',
  authenticate,
  authorize('STUDENT'),
  validate(z.object({
    params: ProgressValidator.courseIdParam.merge(ProgressValidator.lessonIdParam)
  })),
  ProgressController.markLessonIncomplete
);

// Update watch position
router.put(
  '/lessons/:lessonId/watch',
  authenticate,
  authorize('STUDENT'),
  validate(z.object({
    params: ProgressValidator.courseIdParam.merge(ProgressValidator.lessonIdParam),
    body: ProgressValidator.watchPositionBody
  })),
  ProgressController.updateWatchPosition
);

export default router;
