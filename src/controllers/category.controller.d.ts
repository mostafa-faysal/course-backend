import { Request, Response, NextFunction } from 'express';
export declare class CategoryController {
    static getAllCategories(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getCategoryById(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    static createCategory(req: Request, res: Response, next: NextFunction): Promise<void>;
    static updateCategory(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    static deleteCategory(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=category.controller.d.ts.map