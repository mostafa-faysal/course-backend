import { prisma } from '../config/db';

export class CategoryService {
  public static async getAllCategories() {
    return prisma.category.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: { courses: true },
        },
      },
    });
  }

  public static async getCategoryById(id: string) {
    return prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { courses: true },
        },
      },
    });
  }

  public static async createCategory(data: { name: string; icon?: string }) {
    return prisma.category.create({
      data,
    });
  }

  public static async updateCategory(id: string, data: { name?: string; icon?: string }) {
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  public static async deleteCategory(id: string) {
    return prisma.category.delete({
      where: { id },
    });
  }
}
