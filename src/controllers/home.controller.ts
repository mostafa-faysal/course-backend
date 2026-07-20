import { Request, Response, NextFunction } from 'express';
import { HomeService } from '../services/home.service';

export class HomeController {
  // 1. Aggregated Endpoint
  public static async getHomeData(req: Request, res: Response, next: NextFunction) {
    try {
      const [
        hero,
        categories,
        featuredCourses,
        topInstructors,
        testimonials,
        statistics,
        faq,
        footer,
      ] = await Promise.all([
        HomeService.getHeroData(),
        HomeService.getCategories(),
        HomeService.getFeaturedCourses(),
        HomeService.getTopInstructors(),
        HomeService.getTestimonials(),
        HomeService.getStatistics(),
        HomeService.getFAQ(),
        HomeService.getFooter(),
      ]);

      res.status(200).json({
        status: 'success',
        data: { hero, categories, featuredCourses, topInstructors, testimonials, statistics, faq, footer },
      });
    } catch (error) {
      next(error);
    }
  }

  // 2. Individual Endpoints
  public static async getHero(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await HomeService.getHeroData();
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  public static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await HomeService.getCategories();
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  public static async getFeaturedCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await HomeService.getFeaturedCourses();
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  public static async getTopInstructors(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await HomeService.getTopInstructors();
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  public static async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await HomeService.getStatistics();
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  public static async getTestimonials(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await HomeService.getTestimonials();
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  public static async getFAQ(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await HomeService.getFAQ();
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  public static async getFooter(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await HomeService.getFooter();
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }
}
