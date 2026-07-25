import { Router } from 'express';
import { LearningPlanController } from '../controllers/learning-plan.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

// All routes require STUDENT role
router.use(authenticate, authorize('STUDENT'));

router.get('/', LearningPlanController.getLearningPlan);
router.post('/courses', LearningPlanController.addCourse);
router.put('/courses/reorder', LearningPlanController.reorderCourses);
router.delete('/courses/:courseId', LearningPlanController.removeCourse);
router.get('/recommendations', LearningPlanController.getRecommendations);

export default router;
