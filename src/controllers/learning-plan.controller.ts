import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { LearningPlanService } from '../services/learning-plan.service';
import { addCourseToPlanSchema, reorderLearningPlanSchema, courseIdParamSchema } from '../validators/learning-plan.validator';

export class LearningPlanController {
  public static async getLearningPlan(req: AuthRequest, res: Response) {
    try {
      const studentId = req.user!.id;
      const data = await LearningPlanService.getLearningPlan(studentId);
      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async addCourse(req: AuthRequest, res: Response) {
    try {
      const studentId = req.user!.id;
      const validated = addCourseToPlanSchema.safeParse(req.body);
      if (!validated.success) {
        return res.status(422).json({ error: 'Validation Error', details: validated.error.issues });
      }

      const result = await LearningPlanService.addCourse(studentId, validated.data.course_id);
      return res.status(201).json(result);
    } catch (error: any) {
      const msg = error.message;
      if (msg.includes('Not Found')) return res.status(404).json({ error: msg });
      if (msg.includes('Conflict')) return res.status(409).json({ error: msg });
      if (msg.includes('Bad Request')) return res.status(400).json({ error: msg });
      return res.status(500).json({ error: msg });
    }
  }

  public static async removeCourse(req: AuthRequest, res: Response) {
    try {
      const studentId = req.user!.id;
      const validated = courseIdParamSchema.safeParse(req.params);
      if (!validated.success) {
        return res.status(422).json({ error: 'Validation Error', details: validated.error.issues });
      }

      await LearningPlanService.removeCourse(studentId, validated.data.courseId);
      return res.status(200).json({ message: 'Course removed and sequence normalized' });
    } catch (error: any) {
      const msg = error.message;
      if (msg.includes('Not Found')) return res.status(404).json({ error: msg });
      return res.status(500).json({ error: msg });
    }
  }

  public static async reorderCourses(req: AuthRequest, res: Response) {
    try {
      const studentId = req.user!.id;
      const validated = reorderLearningPlanSchema.safeParse(req.body);
      if (!validated.success) {
        return res.status(422).json({ error: 'Validation Error', details: validated.error.issues });
      }

      await LearningPlanService.reorderCourses(studentId, validated.data.ordered_course_ids);
      return res.status(200).json({ message: 'Learning plan reordered successfully' });
    } catch (error: any) {
      const msg = error.message;
      if (msg.includes('Bad Request')) return res.status(400).json({ error: msg });
      if (msg.includes('Not Found')) return res.status(404).json({ error: msg });
      return res.status(500).json({ error: msg });
    }
  }

  public static async getRecommendations(req: AuthRequest, res: Response) {
    try {
      const studentId = req.user!.id;
      const recommendations = await LearningPlanService.getRecommendations(studentId);
      return res.status(200).json(recommendations);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
