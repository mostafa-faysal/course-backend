import { Course, Section, Lesson, Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { NotificationHelper } from '../helpers/notification.helper';

export class CourseService {
  /**
   * Create a new course
   */
  public static async createCourse(data: Omit<Course, 'id' | 'created_at' | 'updated_at'>) {
    // Check if the instructor exists and has the INSTRUCTOR role
    const instructor = await prisma.user.findUnique({
      where: { id: data.instructor_id, role: 'INSTRUCTOR' },
    });
    if (!instructor) {
      throw new Error('Instructor not found or user is not an instructor');
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: data.category_id },
    });
    if (!category) {
      throw new Error('Category not found');
    }

    // Create course
    const courseData: Prisma.CourseUncheckedCreateInput = {
      instructor_id: data.instructor_id,
      category_id: data.category_id,
      title: data.title,
      description: data.description,
      thumbnail: data.thumbnail,
      preview_video: data.preview_video,
      price: data.price,
      discount_price: data.discount_price,
      level: data.level,
      language: data.language,
      status: data.status,
      requirements: data.requirements || [],
      learning_outcomes: data.learning_outcomes || [],
    };

    const course = await prisma.course.create({
      data: courseData,
      include: {
        category: true,
      },
    });

    // Notify Admins
    if (course.status === 'PENDING') {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
      if (admins.length > 0) {
        await NotificationHelper.sendNewCourseSubmitted(admins.map(a => a.id), course.id, course.title);
      }
    }

    return course;
  }

  /**
   * Get all courses with pagination, search, filter, and sorting
   */
  public static async getAllCourses(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const {
      search,
      category_id,
      instructor_id,
      level,
      language,
      min_price,
      max_price,
      status,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = query;

    // Prisma Where clause for filtering and search
    const where: any = {};
    if (category_id) where.category_id = category_id;
    if (instructor_id) where.instructor_id = instructor_id;
    if (level) where.level = level;
    if (language) where.language = language;
    if (status) where.status = status;

    // Price range filter
    if (min_price !== undefined || max_price !== undefined) {
      where.price = {};
      if (min_price !== undefined) where.price.gte = Number(min_price);
      if (max_price !== undefined) where.price.lte = Number(max_price);
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Prisma OrderBy: handle sorting by relation count (popularity)
    let orderBy: any = {};
    if (sort_by === 'enrollments') {
      orderBy = { enrollments: { _count: sort_order } };
    } else {
      orderBy = { [sort_by]: sort_order };
    }

    // Get Total Count for Pagination Metadata
    const totalCount = await prisma.course.count({ where });
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch paginated data
    const courses = await prisma.course.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        instructor: { select: { id: true, full_name: true, profile_picture: true } },
        category: { select: { id: true, name: true } },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    return {
      metadata: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
      },
      courses,
    };
  }

  /**
   * Get a course by ID
   */
  public static async getCourseById(id: string) {
    return prisma.course.findUnique({
      where: { id },
    });
  }

  /**
   * Update a course by ID
   */
  public static async updateCourse(id: string, data: Partial<Omit<Course, 'id' | 'created_at' | 'updated_at'>>) {
    // If category is being updated, verify it exists
    if (data.category_id) {
      const category = await prisma.category.findUnique({
        where: { id: data.category_id },
      });
      if (!category) {
        throw new Error('Category not found');
      }
    }

    return prisma.course.update({
      where: { id },
      data,
      include: {
        category: true,
      },
    });
  }

  /**
   * Delete a course by ID
   */
  public static async deleteCourse(id: string) {
    return prisma.course.delete({
      where: { id },
    });
  }

  /**
   * Get detailed information of a course, masking video_url if not a free preview
   */
  public static async getCourseDetails(id: string) {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        instructor: {
          select: {
            id: true,
            full_name: true,
            profile_picture: true,
            bio: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        sections: {
          orderBy: {
            sequence_order: 'asc',
          },
          include: {
            lessons: {
              orderBy: {
                sequence_order: 'asc',
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!course) return null;

    // Mask video_url unless is_free_preview is true
    const sanitizedSections = course.sections.map((section: Section & { lessons: Lesson[] }) => ({
      ...section,
      lessons: section.lessons.map((lesson: Lesson) => {
        const { video_url, ...lessonData } = lesson;
        return {
          ...lessonData,
          video_url: lesson.is_free_preview ? video_url : null,
        };
      }),
    }));

    return {
      ...course,
      sections: sanitizedSections,
    };
  }

  /**
   * Get related courses based on category, excluding the current course
   */
  public static async getRelatedCourses(courseId: string, limit: number = 5) {
    // 1. Find the current course to get its category
    const currentCourse = await prisma.course.findUnique({
      where: { id: courseId },
      select: { category_id: true },
    });

    if (!currentCourse) {
      throw new Error('Course not found');
    }

    // 2. Fetch related courses in the same category, excluding the current one
    const relatedCourses = await prisma.course.findMany({
      where: {
        category_id: currentCourse.category_id,
        id: { not: courseId },
        status: 'PUBLISHED',
      },
      take: limit,
      orderBy: [
        // Sort by enrollments descending as an example of relevance/popularity
        {
          enrollments: {
            _count: 'desc'
          }
        },
        { created_at: 'desc' }
      ],
      select: {
        id: true,
        title: true,
        price: true,
        discount_price: true,
        thumbnail: true,
        level: true,
        instructor: {
          select: {
            id: true,
            full_name: true,
            profile_picture: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            reviews: {
              where: { status: 'APPROVED' }
            }
          }
        }
      },
    });

    return relatedCourses;
  }
}




