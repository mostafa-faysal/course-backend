export declare class CategoryService {
    static getAllCategories(): Promise<any>;
    static getCategoryById(id: string): Promise<any>;
    static createCategory(data: {
        name: string;
        icon?: string;
    }): Promise<any>;
    static updateCategory(id: string, data: {
        name?: string;
        icon?: string;
    }): Promise<any>;
    static deleteCategory(id: string): Promise<any>;
}
//# sourceMappingURL=category.service.d.ts.map