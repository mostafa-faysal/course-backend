import { Request, Response, NextFunction } from 'express';
import { HomeService } from '../services/home.service';

export class HomeController {
  // 1. Lightweight Global Shell / Config Endpoint
  public static async getHomeData(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await HomeService.getConfig();
      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await HomeService.getConfig();
      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // 2. Individual Section Endpoints (For Lazy Loading on Front-End)
  public static async getHero(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await HomeService.getHeroData();
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  public static async getPartners(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await HomeService.getPartners();
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  public static async getWhyChooseUs(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await HomeService.getWhyChooseUs();
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

  public static async getTopRatedCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await HomeService.getTopRatedCourses();
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  public static async getPopularCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await HomeService.getPopularCourses();
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  public static async getNewCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await HomeService.getNewCourses();
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

  public static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await HomeService.getSettings();
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  public static async getFooter(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await HomeService.getFooter();
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  public static async getSearchSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const query = (req.query.q || req.query.query || '') as string;
      const data = await HomeService.getSearchSuggestions(query);
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }
}
