import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AssignmentService } from '../services/assignment.service';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  submitAssignmentSchema,
  gradeAssignmentSchema,
  assignmentIdParamSchema,
  submissionIdParamSchema,
  courseIdParamSchema
} from '../validators/assignment.validator';

export class AssignmentController {
  // ----------------------------------------------------------------------
  // INSTRUCTOR METHODS
  // ----------------------------------------------------------------------

  public static async createAssignment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { courseId } = courseIdParamSchema.parse(req.params);
      const data = createAssignmentSchema.parse(req.body);
      const instructorId = req.user!.id;

      const assignment = await AssignmentService.createAssignment(instructorId, courseId, data);
      res.status(201).json({ success: true, data: assignment });
    } catch (error) {
      next(error);
    }
  }

  public static async updateAssignment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { assignmentId } = assignmentIdParamSchema.parse(req.params);
      const data = updateAssignmentSchema.parse(req.body);
      const instructorId = req.user!.id;

      const assignment = await AssignmentService.updateAssignment(instructorId, assignmentId, data);
      res.status(200).json({ success: true, data: assignment });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteAssignment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { assignmentId } = assignmentIdParamSchema.parse(req.params);
      const instructorId = req.user!.id;

      const result = await AssignmentService.deleteAssignment(instructorId, assignmentId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  public static async getInstructorAssignments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { courseId } = courseIdParamSchema.parse(req.params);
      const instructorId = req.user!.id;

      const assignments = await AssignmentService.getInstructorAssignments(instructorId, courseId);
      res.status(200).json({ success: true, data: assignments });
    } catch (error) {
      next(error);
    }
  }

  public static async getAssignmentSubmissions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { assignmentId } = assignmentIdParamSchema.parse(req.params);
      const instructorId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await AssignmentService.getAssignmentSubmissions(instructorId, assignmentId, page, limit);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  public static async getSubmissionAttempts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { submissionId } = submissionIdParamSchema.parse(req.params);
      const instructorId = req.user!.id;

      const attempts = await AssignmentService.getSubmissionAttempts(instructorId, submissionId);
      res.status(200).json({ success: true, data: attempts });
    } catch (error) {
      next(error);
    }
  }

  public static async gradeSubmission(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { submissionId } = submissionIdParamSchema.parse(req.params);
      const data = gradeAssignmentSchema.parse(req.body);
      const instructorId = req.user!.id;

      const result = await AssignmentService.gradeSubmission(instructorId, submissionId, data.score, data.feedback);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  public static async getAssignmentStatistics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { assignmentId } = assignmentIdParamSchema.parse(req.params);
      const instructorId = req.user!.id;

      const stats = await AssignmentService.getAssignmentStatistics(instructorId, assignmentId);
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  // ----------------------------------------------------------------------
  // STUDENT METHODS
  // ----------------------------------------------------------------------

  public static async getStudentDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.id;

      const dashboard = await AssignmentService.getStudentDashboard(studentId);
      res.status(200).json({ success: true, data: dashboard });
    } catch (error) {
      next(error);
    }
  }

  public static async getStudentAssignments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { courseId } = courseIdParamSchema.parse(req.params);
      const studentId = req.user!.id;

      const assignments = await AssignmentService.getStudentAssignments(studentId, courseId);
      res.status(200).json({ success: true, data: assignments });
    } catch (error) {
      next(error);
    }
  }

  public static async getStudentSubmission(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { assignmentId } = assignmentIdParamSchema.parse(req.params);
      const studentId = req.user!.id;

      const submission = await AssignmentService.getStudentSubmission(studentId, assignmentId);
      res.status(200).json({ success: true, data: submission });
    } catch (error) {
      next(error);
    }
  }

  public static async submitAssignment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { assignmentId } = assignmentIdParamSchema.parse(req.params);
      const data = submitAssignmentSchema.parse(req.body);
      const studentId = req.user!.id;

      const result = await AssignmentService.submitAssignment(studentId, assignmentId, data);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
