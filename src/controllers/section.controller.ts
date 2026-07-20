import { Response, NextFunction } from 'express';
import { SectionService } from '../services/section.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { handleDomainError } from '../utils/domain-error';
export class SectionController {
  /**
   * Create a new section
   */
  public static async createSection(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const courseId = req.params.courseId as string;
      const userId = req.user!.id;
      const role = req.user!.role;

      const section = await SectionService.createSection(courseId, userId, role, req.body);

      res.status(201).json({
        status: 'success',
        message: 'Section created successfully',
        data: section,
      });
    } catch (error: any) {
      handleDomainError(error, res, next);
    }
  }

  /**
   * Update a section
   */
  public static async updateSection(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const courseId = req.params.courseId as string;
      const sectionId = req.params.sectionId as string;
      const userId = req.user!.id;
      const role = req.user!.role;

      const section = await SectionService.updateSection(courseId, sectionId, userId, role, req.body);

      res.status(200).json({
        status: 'success',
        message: 'Section updated successfully',
        data: section,
      });
    } catch (error: any) {
      handleDomainError(error, res, next);
    }
  }

  /**
   * Delete a section
   */
  public static async deleteSection(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const courseId = req.params.courseId as string;
      const sectionId = req.params.sectionId as string;
      const userId = req.user!.id;
      const role = req.user!.role;

      await SectionService.deleteSection(courseId, sectionId, userId, role);

      res.status(200).json({
        status: 'success',
        message: 'Section deleted successfully',
      });
    } catch (error: any) {
      handleDomainError(error, res, next);
    }
  }
}
