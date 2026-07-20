import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';

export class CategoryController {
  public static async getAllCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await CategoryService.getAllCategories();
      res.status(200).json({ status: 'success', data: categories });
    } catch (error) {
      next(error);
    }
  }

  public static async getCategoryById(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await CategoryService.getCategoryById(req.params.id as string);
      if (!category) {
        return res.status(404).json({ status: 'error', message: 'Category not found' });
      }
      res.status(200).json({ status: 'success', data: category });
    } catch (error) {
      next(error);
    }
  }

  public static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const newCategory = await CategoryService.createCategory(req.body);
      res.status(201).json({ status: 'success', data: newCategory });
    } catch (error) {
      next(error);
    }
  }

  public static async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      // Check if exists first
      const existing = await CategoryService.getCategoryById(req.params.id as string);
      if (!existing) {
        return res.status(404).json({ status: 'error', message: 'Category not found' });
      }

      const updatedCategory = await CategoryService.updateCategory(req.params.id as string, req.body);
      res.status(200).json({ status: 'success', data: updatedCategory });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const existing = await CategoryService.getCategoryById(req.params.id as string);
      if (!existing) {
        return res.status(404).json({ status: 'error', message: 'Category not found' });
      }

      await CategoryService.deleteCategory(req.params.id as string);
      res.status(204).send(); // 204 No Content
    } catch (error) {
      next(error);
    }
  }
}
