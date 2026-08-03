import { prisma } from '../config/db';
import { cache, CACHE_TAGS } from '../cache';

export class CategoryService {
  private static async invalidateCategoryCaches() {
    await Promise.all([
      cache.invalidateByTag(CACHE_TAGS.HOME_CATEGORIES),
      cache.invalidateByTag(CACHE_TAGS.SEARCH_SUGGESTIONS),
    ]);
  }

  public static async getAllCategories() {
    return prisma.category.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        name: true,
        created_at: true,
        _count: {
          select: { courses: true },
        },
      },
    });
  }

  public static async getCategoryById(id: string) {
    return prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        created_at: true,
        _count: {
          select: { courses: true },
        },
      },
    });
  }

  public static async createCategory(data: { name: string }) {
    const category = await prisma.category.create({
      data,
      select: {
        id: true,
        name: true,
        created_at: true,
      },
    });
    await this.invalidateCategoryCaches();
    return category;
  }

  public static async updateCategory(id: string, data: { name?: string }) {
    const updated = await prisma.category.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        created_at: true,
      },
    });
    await this.invalidateCategoryCaches();
    return updated;
  }

  public static async deleteCategory(id: string) {
    const deleted = await prisma.category.delete({
      where: { id },
      select: {
        id: true,
        name: true,
        created_at: true,
      },
    });
    await this.invalidateCategoryCaches();
    return deleted;
  }
}
