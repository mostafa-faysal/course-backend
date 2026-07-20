"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const db_1 = require("../config/db");
class CategoryService {
    static async getAllCategories() {
        return db_1.prisma.category.findMany({
            orderBy: { created_at: 'desc' },
            include: {
                _count: {
                    select: { courses: true },
                },
            },
        });
    }
    static async getCategoryById(id) {
        return db_1.prisma.category.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { courses: true },
                },
            },
        });
    }
    static async createCategory(data) {
        return db_1.prisma.category.create({
            data,
        });
    }
    static async updateCategory(id, data) {
        return db_1.prisma.category.update({
            where: { id },
            data,
        });
    }
    static async deleteCategory(id) {
        return db_1.prisma.category.delete({
            where: { id },
        });
    }
}
exports.CategoryService = CategoryService;
