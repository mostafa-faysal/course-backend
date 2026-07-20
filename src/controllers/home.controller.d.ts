import { Request, Response, NextFunction } from 'express';
export declare class HomeController {
    static getHomeData(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getHero(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getCategories(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getFeaturedCourses(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getTopInstructors(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getStatistics(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getTestimonials(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getFAQ(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getFooter(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=home.controller.d.ts.map