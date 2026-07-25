import { Router } from 'express';
import { AssignmentController } from '../controllers/assignment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  submitAssignmentSchema,
  gradeAssignmentSchema
} from '../validators/assignment.validator';

const instructorRouter = Router({ mergeParams: true });
const studentRouter = Router({ mergeParams: true });

// ----------------------------------------------------------------------
// INSTRUCTOR ROUTES
// ----------------------------------------------------------------------
instructorRouter.use(authenticate, authorize('INSTRUCTOR'));

/**
 * @swagger
 * tags:
 *   name: Instructor Assignments
 *   description: Assignment management for instructors
 */

instructorRouter.post('/courses/:courseId/assignments', validate(createAssignmentSchema), AssignmentController.createAssignment);
instructorRouter.get('/courses/:courseId/assignments', AssignmentController.getInstructorAssignments);

instructorRouter.put('/assignments/:assignmentId', validate(updateAssignmentSchema), AssignmentController.updateAssignment);
instructorRouter.delete('/assignments/:assignmentId', AssignmentController.deleteAssignment);
instructorRouter.get('/assignments/:assignmentId/submissions', AssignmentController.getAssignmentSubmissions);
instructorRouter.get('/assignments/:assignmentId/statistics', AssignmentController.getAssignmentStatistics);

instructorRouter.get('/submissions/:submissionId/attempts', AssignmentController.getSubmissionAttempts);
instructorRouter.put('/submissions/:submissionId/grade', validate(gradeAssignmentSchema), AssignmentController.gradeSubmission);

// ----------------------------------------------------------------------
// STUDENT ROUTES
// ----------------------------------------------------------------------
studentRouter.use(authenticate, authorize('STUDENT'));

/**
 * @swagger
 * tags:
 *   name: Student Assignments
 *   description: Assignment tracking and submission for students
 */

studentRouter.get('/dashboard/assignments', AssignmentController.getStudentDashboard);
studentRouter.get('/courses/:courseId/assignments', AssignmentController.getStudentAssignments);
studentRouter.get('/assignments/:assignmentId/submission', AssignmentController.getStudentSubmission);
studentRouter.post('/assignments/:assignmentId/submit', validate(submitAssignmentSchema), AssignmentController.submitAssignment);

export { instructorRouter as instructorAssignmentRoutes, studentRouter as studentAssignmentRoutes };
