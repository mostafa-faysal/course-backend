import { Prisma, EnrollmentStatus } from '@prisma/client';
import { prisma } from '../config/db';
import { NotificationHelper } from '../helpers/notification.helper';

export class InstructorService {
  /**
   * 1. Get Instructor Profile
   */
  public static async getProfile(instructorId: string) {
    const instructor = await prisma.user.findUnique({
      where: { id: instructorId, role: 'INSTRUCTOR' },
      select: {
        id: true,
        full_name: true,
        email: true,
        bio: true,
        profile_picture: true,
        country: true,
        language: true,
        created_at: true,
      },
    });

    if (!instructor) {
      throw new Error('Instructor not found');
    }

    return instructor;
  }

  /**
   * 2. Dashboard Overview
   */
  public static async getDashboard(instructorId: string) {
    // Basic courses aggregation
    const coursesStats = await prisma.course.groupBy({
      by: ['status'],
      where: { instructor_id: instructorId },
      _count: { id: true },
    });

    let totalCourses = 0;
    let publishedCourses = 0;
    let draftCourses = 0;

    for (const stat of coursesStats) {
      totalCourses += stat._count.id;
      if (stat.status === 'PUBLISHED') publishedCourses += stat._count.id;
      if (stat.status === 'DRAFT') draftCourses += stat._count.id;
    }

    // Revenue
    const revenueAggr = await prisma.orderItem.aggregate({
      _sum: { price: true },
      where: {
        course: { instructor_id: instructorId },
        order: { payment: { status: 'SUCCESS' } },
      },
    });
    const totalRevenue = revenueAggr._sum.price || 0;

    // Students
    const uniqueStudents = await prisma.enrollment.findMany({
      where: { course: { instructor_id: instructorId } },
      select: { student_id: true },
      distinct: ['student_id'],
    });
    const totalStudents = uniqueStudents.length;

    // Reviews
    const reviewsAggr = await prisma.review.aggregate({
      _avg: { rating: true },
      _count: { id: true },
      where: { course: { instructor_id: instructorId } },
    });

    // Latest Enrollments (last 5)
    const latestEnrollments = await prisma.enrollment.findMany({
      where: { course: { instructor_id: instructorId } },
      take: 5,
      orderBy: { enrolled_at: 'desc' },
      include: {
        course: { select: { id: true, title: true } },
        student: { select: { id: true, full_name: true, email: true } },
      }
    });

    return {
      totalCourses,
      publishedCourses,
      draftCourses,
      totalStudents,
      totalRevenue,
      averageRating: reviewsAggr._avg.rating ? parseFloat(reviewsAggr._avg.rating.toFixed(2)) : 0,
      totalReviews: reviewsAggr._count.id,
      latestEnrollments,
    };
  }

  /**
   * 3. Instructor Courses
   */
  public static async getCourses(instructorId: string, page: number, limit: number, search?: string, sort: string = 'created_at', order: string = 'desc') {
    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = {
      instructor_id: instructorId,
      ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
    };

    const allowedSortFields = ['created_at', 'title', 'price'];
    const orderByField = allowedSortFields.includes(sort) ? sort : 'created_at';
    const orderByOrder = order === 'asc' ? 'asc' : 'desc';

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderByField]: orderByOrder },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          discount_price: true,
          thumbnail: true,
          card_image: true,
          cover_image: true,
          status: true,
          level: true,
          language: true,
          duration_hours: true,
          duration_weeks: true,
          projects_count: true,
          created_at: true,
          updated_at: true,
          _count: {
            select: { enrollments: true, reviews: true },
          },
        },
      }),
      prisma.course.count({ where }),
    ]);

    // Calculate revenue and avg rating per course
    const courseIds = courses.map(c => c.id);
    
    const [revenues, ratings] = await Promise.all([
      prisma.orderItem.groupBy({
        by: ['course_id'],
        where: { course_id: { in: courseIds }, order: { payment: { status: 'SUCCESS' } } },
        _sum: { price: true },
      }),
      prisma.review.groupBy({
        by: ['course_id'],
        where: { course_id: { in: courseIds } },
        _avg: { rating: true },
      }),
    ]);

    const mappedCourses = courses.map(course => {
      const rev = revenues.find(r => r.course_id === course.id);
      const rat = ratings.find(r => r.course_id === course.id);
      return {
        ...course,
        totalRevenue: rev?._sum.price || 0,
        averageRating: rat?._avg.rating ? parseFloat(rat._avg.rating.toFixed(2)) : 0,
      };
    });

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: mappedCourses,
    };
  }

  /**
   * 4. Course Statistics
   */
  public static async getCourseStats(instructorId: string, courseId: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        _count: { select: { enrollments: true, reviews: true } }
      }
    });

    if (!course) {
      throw new Error('Course not found');
    }

    if (course.instructor_id !== instructorId) {
      throw new Error('Forbidden: Course belongs to another instructor');
    }

    const [revenueAggr, completionAggr] = await Promise.all([
      prisma.orderItem.aggregate({
        _sum: { price: true },
        where: { course_id: courseId, order: { payment: { status: 'SUCCESS' } } },
      }),
      prisma.enrollment.aggregate({
        _avg: { progress_percentage: true },
        where: { course_id: courseId },
      })
    ]);

    const completedEnrollments = await prisma.enrollment.count({
      where: { course_id: courseId, progress_percentage: 100 },
    });

    return {
      courseId,
      title: course.title,
      totalEnrollments: course._count.enrollments,
      totalReviews: course._count.reviews,
      totalRevenue: revenueAggr._sum.price || 0,
      averageProgress: completionAggr._avg.progress_percentage || 0,
      completedEnrollments,
    };
  }

  /**
   * 5. Revenue Statistics
   */
  public static async getRevenue(instructorId: string, period: 'month' | 'year' | 'all') {
    const where: Prisma.OrderItemWhereInput = {
      course: { instructor_id: instructorId },
      order: { payment: { status: 'SUCCESS' } },
    };

    if (period === 'month') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      where.order = { ...where.order as any, created_at: { gte: startOfMonth } };
    } else if (period === 'year') {
      const startOfYear = new Date();
      startOfYear.setMonth(0, 1);
      startOfYear.setHours(0, 0, 0, 0);
      where.order = { ...where.order as any, created_at: { gte: startOfYear } };
    }

    const revenueAggr = await prisma.orderItem.aggregate({
      _sum: { price: true },
      where,
    });

    return {
      period,
      totalRevenue: revenueAggr._sum.price || 0,
    };
  }

  /**
   * 6. Student Analytics
   */
  public static async getStudents(instructorId: string, page: number, limit: number, search?: string, courseId?: string, sort: string = 'created_at', order: string = 'desc') {
    const skip = (page - 1) * limit;

    const courseFilter: any = { instructor_id: instructorId };
    if (courseId) courseFilter.id = courseId;

    const studentWhere: Prisma.UserWhereInput = {
      enrollments: {
        some: {
          course: courseFilter,
          status: 'ACTIVE',
        }
      },
      ...(search ? {
        OR: [
          { full_name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ]
      } : {})
    };

    const allowedSorts = ['created_at', 'full_name'];
    const orderByField = allowedSorts.includes(sort) ? sort : 'created_at';
    const orderByOrder = order === 'asc' ? 'asc' : 'desc';

    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where: studentWhere,
        skip,
        take: limit,
        orderBy: { [orderByField]: orderByOrder },
        select: {
          id: true,
          full_name: true,
          email: true,
          created_at: true,
          last_login: true,
          enrollments: {
            where: { course: courseFilter, status: 'ACTIVE' },
            select: { progress_percentage: true, completed_at: true, course_id: true, course: { select: { id: true, title: true } } },
          }
        }
      }),
      prisma.user.count({ where: studentWhere })
    ]);

    const data = students.map(s => {
      const totalCoursesPurchased = s.enrollments.length;
      const completedCourses = s.enrollments.filter(e => e.progress_percentage === 100).length;
      const totalProgress = s.enrollments.reduce((sum, e) => sum + e.progress_percentage, 0);
      const averageProgress = totalCoursesPurchased > 0 ? parseFloat((totalProgress / totalCoursesPurchased).toFixed(2)) : 0;

      return {
        id: s.id,
        fullName: s.full_name,
        email: s.email,
        totalCoursesPurchased,
        completedCourses,
        averageProgress,
        lastActive: s.last_login,
        joinedAt: s.created_at,
      };
    });

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data,
    };
  }

  /**
   * 7. Latest Enrollments
   */
  public static async getLatestEnrollments(instructorId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const where: Prisma.EnrollmentWhereInput = {
      course: { instructor_id: instructorId },
    };

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { enrolled_at: 'desc' },
        include: {
          course: { select: { id: true, title: true } },
          student: { select: { id: true, full_name: true, email: true } },
        }
      }),
      prisma.enrollment.count({ where })
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: enrollments,
    };
  }

  /**
   * 8. Reviews Overview
   */
  public static async getReviews(instructorId: string, page: number, limit: number, search?: string, sort: string = 'created_at', order: string = 'desc') {
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {
      course: { instructor_id: instructorId },
      ...(search ? { comment: { contains: search, mode: 'insensitive' } } : {})
    };

    const allowedSortFields = ['created_at', 'rating'];
    const orderByField = allowedSortFields.includes(sort) ? sort : 'created_at';
    const orderByOrder = order === 'asc' ? 'asc' : 'desc';

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderByField]: orderByOrder },
        include: {
          course: { select: { id: true, title: true } },
          student: { select: { id: true, full_name: true } },
        }
      }),
      prisma.review.count({ where })
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: reviews,
    };
  }

  /**
   * 8. Revoke Student Enrollment (Instructor capability)
   */
  public static async revokeStudentEnrollment(instructorId: string, courseId: string, studentId: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, instructor_id: true }
    });
    if (!course || course.instructor_id !== instructorId) {
      throw new Error('Forbidden: Course not found or not owned by instructor');
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { student_id_course_id: { student_id: studentId, course_id: courseId } }
    });
    if (!enrollment) {
      throw new Error('Not Found: Student is not enrolled in this course');
    }
    if (enrollment.status === 'REVOKED') {
      throw new Error('Conflict: Enrollment is already revoked');
    }

    const updated = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: 'REVOKED' },
      select: { id: true, student_id: true, course_id: true, status: true }
    });

    try {
      await NotificationHelper.sendEnrollmentRevoked(studentId, courseId, course.title);
    } catch (e) {
      console.error('Error sending revocation notification:', e);
    }

    return updated;
  }
}
