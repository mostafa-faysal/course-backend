import { PrismaClient, Prisma, Role, UserStatus, CourseStatus, ReviewStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { NotificationHelper } from '../helpers/notification.helper';
import { cache, CACHE_TAGS } from '../cache';

const prisma = new PrismaClient();

import crypto from 'crypto';

export class AdminService {
  public static async getDashboard() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      usersGroup,
      totalStudents,
      totalInstructors,
      totalAdmins,
      coursesGroup,
      totalCategories,
      totalEnrollments,
      ordersGroup,
      totalRevenueAggr,
      todayRevenueAggr,
      monthRevenueAggr,
      yearRevenueAggr,
      reviewsAggr,
      latestUsers,
      latestCourses,
      latestOrders,
      latestReviews,
      latestEnrollments
    ] = await Promise.all([
      prisma.user.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'INSTRUCTOR' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.course.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.category.count(),
      prisma.enrollment.count(),
      prisma.order.groupBy({ by: ['status'], _count: { id: true } }),
      
      prisma.orderItem.aggregate({
        _sum: { price: true },
        where: { order: { payment: { status: 'SUCCESS' } } }
      }),
      prisma.orderItem.aggregate({
        _sum: { price: true },
        where: { order: { payment: { status: 'SUCCESS' }, created_at: { gte: startOfToday } } }
      }),
      prisma.orderItem.aggregate({
        _sum: { price: true },
        where: { order: { payment: { status: 'SUCCESS' }, created_at: { gte: startOfMonth } } }
      }),
      prisma.orderItem.aggregate({
        _sum: { price: true },
        where: { order: { payment: { status: 'SUCCESS' }, created_at: { gte: startOfYear } } }
      }),

      prisma.review.aggregate({ _avg: { rating: true }, _count: { id: true } }),

      prisma.user.findMany({ take: 5, orderBy: { created_at: 'desc' }, select: { id: true, full_name: true, email: true, role: true, created_at: true } }),
      prisma.course.findMany({ take: 5, orderBy: { created_at: 'desc' }, select: { id: true, title: true, status: true, created_at: true, instructor: { select: { full_name: true } } } }),
      prisma.order.findMany({ take: 5, orderBy: { created_at: 'desc' }, select: { id: true, total_price: true, status: true, created_at: true, student: { select: { full_name: true } } } }),
      prisma.review.findMany({ take: 5, orderBy: { created_at: 'desc' }, select: { id: true, rating: true, comment: true, created_at: true, student: { select: { full_name: true } }, course: { select: { title: true } } } }),
      prisma.enrollment.findMany({ take: 5, orderBy: { enrolled_at: 'desc' }, select: { id: true, progress_percentage: true, enrolled_at: true, student: { select: { full_name: true } }, course: { select: { title: true } } } }),
    ]);

    // Parse User stats
    let totalUsers = 0, activeUsers = 0, inactiveUsers = 0;
    usersGroup.forEach(g => {
      totalUsers += g._count.id;
      if (g.status === 'ACTIVE') activeUsers += g._count.id;
      if (g.status === 'SUSPENDED') inactiveUsers += g._count.id;
    });

    // Parse Course stats
    let totalCourses = 0, publishedCourses = 0, draftCourses = 0;
    coursesGroup.forEach(g => {
      totalCourses += g._count.id;
      if (g.status === 'PUBLISHED') publishedCourses += g._count.id;
      if (g.status === 'DRAFT') draftCourses += g._count.id;
    });

    // Parse Order stats
    let totalOrders = 0, successfulOrders = 0, pendingOrders = 0, failedOrders = 0;
    ordersGroup.forEach(g => {
      totalOrders += g._count.id;
      if (g.status === 'COMPLETED') successfulOrders += g._count.id;
      if (g.status === 'PENDING') pendingOrders += g._count.id;
      if (g.status === 'FAILED') failedOrders += g._count.id;
    });

    // Recent Activity timeline
    const recentActivity = [
      ...latestUsers.map(u => ({ type: 'New User Registered', message: `${u.full_name} joined as ${u.role}`, date: u.created_at })),
      ...latestCourses.map(c => ({ type: 'Course Created', message: `${c.title} by ${c.instructor.full_name}`, date: c.created_at })),
      ...latestOrders.map(o => ({ type: 'Order Created', message: `Order by ${o.student.full_name} - ${o.status}`, date: o.created_at })),
      ...latestReviews.map(r => ({ type: 'Review Submitted', message: `${r.rating} stars on ${r.course.title} by ${r.student.full_name}`, date: r.created_at })),
      ...latestEnrollments.map(e => ({ type: 'Student Enrolled', message: `${e.student.full_name} enrolled in ${e.course.title}`, date: e.enrolled_at }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);

    return {
      overview: { totalUsers, totalStudents, totalInstructors, totalAdmins, activeUsers, inactiveUsers, totalCourses, publishedCourses, draftCourses, totalCategories, totalEnrollments },
      orders: { totalOrders, successfulOrders, pendingOrders, failedOrders },
      revenue: {
        todayRevenue: todayRevenueAggr._sum.price || 0,
        thisMonthRevenue: monthRevenueAggr._sum.price || 0,
        thisYearRevenue: yearRevenueAggr._sum.price || 0,
        totalRevenue: totalRevenueAggr._sum.price || 0
      },
      reviews: { averageRating: reviewsAggr._avg.rating ? parseFloat(reviewsAggr._avg.rating.toFixed(2)) : 0, totalReviews: reviewsAggr._count.id },
      latestUsers, latestCourses, latestOrders, latestReviews, latestEnrollments,
      recentActivity
    };
  }

  public static async getUsers(page: number, limit: number, search?: string, sort: string = 'created_at', order: string = 'desc', roleFilter?: Role, statusFilter?: UserStatus) {
    const where: Prisma.UserWhereInput = {
      ...(search ? {
        OR: [
          { full_name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      } : {}),
      ...(roleFilter ? { role: roleFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {})
    };

    const [items, totalItems, usersGroup, totalStudents, totalInstructors, totalAdmins] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort]: order },
        select: { id: true, full_name: true, email: true, role: true, status: true, created_at: true, last_login: true }
      }),
      prisma.user.count({ where }),
      prisma.user.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'INSTRUCTOR' } }),
      prisma.user.count({ where: { role: 'ADMIN' } })
    ]);

    let totalUsers = 0, activeUsers = 0, inactiveUsers = 0;
    usersGroup.forEach(g => {
      totalUsers += g._count.id;
      if (g.status === 'ACTIVE') activeUsers += g._count.id;
      if (g.status === 'SUSPENDED') inactiveUsers += g._count.id;
    });

    return {
      summary: { totalUsers, activeUsers, inactiveUsers, totalStudents, totalInstructors, totalAdmins },
      items,
      pagination: {
        page, limit, totalItems,
        totalPages: Math.ceil(totalItems / limit),
        hasNext: page * limit < totalItems,
        hasPrevious: page > 1
      }
    };
  }

  public static async updateUserStatus(adminId: string, targetId: string, newStatus: UserStatus) {
    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
    if (!targetUser) throw new Error('User not found');

    if (targetUser.id === adminId) throw new Error('Forbidden: Admin cannot edit himself');
    if (targetUser.role === 'ADMIN') throw new Error('Forbidden: Admin cannot edit another ADMIN');
    if (targetUser.status === newStatus) throw new Error('Conflict: Status already applied');

    // "Cannot deactivate last ACTIVE ADMIN" -> we already forbid editing any ADMIN, so this is naturally covered.
    // Since rule says "Admin cannot edit another ADMIN", we only need to worry about them editing themselves, which is also blocked.

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { status: newStatus },
      select: { id: true, full_name: true, email: true, role: true, status: true }
    });

    await NotificationHelper.sendStatusChanged(targetId, newStatus);

    return updated;
  }

  public static async createUser(adminId: string, data: { full_name: string; email: string; password?: string; role: Role }) {
    if (data.role === 'ADMIN') {
      throw new Error('Forbidden: Cannot assign ADMIN role during creation');
    }

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new Error('Conflict: Email already exists');
    }

    const generatedPassword = data.password || crypto.randomBytes(8).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(generatedPassword, salt);
    const defaultAvatar = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(data.full_name)}`;

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          full_name: data.full_name,
          email: data.email,
          password_hash,
          profile_picture: defaultAvatar,
          role: data.role,
          status: 'ACTIVE'
        },
        select: {
          id: true,
          full_name: true,
          email: true,
          profile_picture: true,
          role: true,
          status: true,
          created_at: true
        }
      });

      await tx.userRoleHistory.create({
        data: {
          user_id: newUser.id,
          changed_by: adminId,
          old_role: data.role,
          new_role: data.role,
        }
      });

      return newUser;
    });

    await NotificationHelper.sendAccountCreated(user.id);

    return { ...user, initial_password: generatedPassword };
  }

  public static async getUserDetails(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        status: true,
        created_at: true,
        last_login: true,
      }
    });

    if (!user) throw new Error('User not found');
    return user;
  }

  public static async deleteUser(adminId: string, targetId: string) {
    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
    if (!targetUser) throw new Error('User not found');

    if (targetUser.id === adminId) throw new Error('Forbidden: Admin cannot delete himself');
    if (targetUser.role === 'ADMIN') throw new Error('Forbidden: Admin cannot delete another ADMIN');

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: targetId },
        data: { status: 'DELETED' }
      });

      await tx.userActionHistory.create({
        data: {
          user_id: targetId,
          performed_by: adminId,
          action: 'DELETED_ACCOUNT'
        }
      });
    });

    return true;
  }

  public static async resetUserPassword(adminId: string, targetId: string) {
    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
    if (!targetUser) throw new Error('User not found');

    if (targetUser.id === adminId) throw new Error('Forbidden: Admin cannot reset his own password');
    if (targetUser.role === 'ADMIN') throw new Error('Forbidden: Admin cannot reset another ADMIN password');

    const generatedPassword = crypto.randomBytes(8).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(generatedPassword, salt);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: targetId },
        data: {
          password_hash,
          password_updated_at: new Date()
        }
      });

      await tx.userActionHistory.create({
        data: {
          user_id: targetId,
          performed_by: adminId,
          action: 'RESET_PASSWORD'
        }
      });
    });

    await NotificationHelper.sendPasswordReset(targetId);

    return { temporary_password: generatedPassword };
  }

  public static async updateUserRole(adminId: string, targetId: string, newRole: Role) {
    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
    if (!targetUser) throw new Error('User not found');

    if (targetUser.id === adminId) throw new Error('Forbidden: Admin cannot modify his own role');
    if (targetUser.role === 'ADMIN') throw new Error('Forbidden: Admin cannot modify another ADMIN');
    if (newRole === 'ADMIN') throw new Error('Forbidden: Cannot assign ADMIN role');
    if (targetUser.role === newRole) throw new Error('Conflict: Role already applied');

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: targetId },
        data: { role: newRole },
        select: { id: true, full_name: true, email: true, role: true, status: true }
      });

      await tx.userRoleHistory.create({
        data: {
          user_id: targetId,
          changed_by: adminId,
          old_role: targetUser.role,
          new_role: newRole,
        }
      });

      return user;
    });

    await NotificationHelper.sendRoleChanged(targetId, newRole);

    return updated;
  }

  public static async getUserRoleHistory(targetId: string) {
    const user = await prisma.user.findUnique({ where: { id: targetId } });
    if (!user) throw new Error('User not found');

    const history = await prisma.userRoleHistory.findMany({
      where: { user_id: targetId },
      orderBy: { created_at: 'desc' },
      include: {
        admin: {
          select: {
            full_name: true,
            email: true,
          }
        }
      }
    });

    return history.map(h => ({
      old_role: h.old_role,
      new_role: h.new_role,
      changed_by: h.admin ? h.admin.full_name : 'Unknown',
      created_at: h.created_at
    }));
  }

  public static async getCourses(page: number, limit: number, search?: string, sort: string = 'created_at', order: string = 'desc', statusFilter?: CourseStatus, categoryFilter?: string, instructorFilter?: string) {
    const where: Prisma.CourseWhereInput = {
      ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(categoryFilter ? { category_id: categoryFilter } : {}),
      ...(instructorFilter ? { instructor_id: instructorFilter } : {})
    };

    const [items, totalItems, coursesGroup] = await Promise.all([
      prisma.course.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort]: order },
        select: { id: true, title: true, price: true, thumbnail: true, card_image: true, cover_image: true, status: true, duration_hours: true, duration_weeks: true, projects_count: true, created_at: true, category: { select: { name: true } }, instructor: { select: { full_name: true, email: true } } }
      }),
      prisma.course.count({ where }),
      prisma.course.groupBy({ by: ['status'], _count: { id: true } })
    ]);

    let totalCourses = 0, publishedCourses = 0, draftCourses = 0;
    coursesGroup.forEach(g => {
      totalCourses += g._count.id;
      if (g.status === CourseStatus.PUBLISHED) publishedCourses += g._count.id;
      if (g.status === CourseStatus.DRAFT) draftCourses += g._count.id;
    });

    return {
      summary: { totalCourses, publishedCourses, draftCourses },
      items,
      pagination: {
        page, limit, totalItems,
        totalPages: Math.ceil(totalItems / limit),
        hasNext: page * limit < totalItems,
        hasPrevious: page > 1
      }
    };
  }

  public static async updateCourseStatus(courseId: string, newStatus: CourseStatus) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new Error('Course not found');
    if (course.status === newStatus) throw new Error('Conflict: Status already applied');

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: { status: newStatus },
      select: { id: true, title: true, status: true, instructor_id: true }
    });

    if (newStatus === CourseStatus.PUBLISHED) {
      await NotificationHelper.sendCourseApproved(updated.instructor_id, courseId, updated.title);
    } else if (newStatus === CourseStatus.REJECTED) {
      await NotificationHelper.sendCourseRejected(updated.instructor_id, courseId, updated.title);
    }

    await Promise.all([
      cache.invalidateByTag(CACHE_TAGS.HOME_FEATURED),
      cache.invalidateByTag(CACHE_TAGS.HOME_POPULAR),
      cache.invalidateByTag(CACHE_TAGS.HOME_TOP_RATED),
      cache.invalidateByTag(CACHE_TAGS.HOME_NEW),
      cache.invalidateByTag(CACHE_TAGS.HOME_STATISTICS),
      cache.invalidateByTag(CACHE_TAGS.SEARCH_SUGGESTIONS),
    ]);

    return updated;
  }

  public static async getReviews(page: number, limit: number, search?: string, sort: string = 'created_at', order: string = 'desc', ratingFilter?: number, statusFilter?: ReviewStatus) {
    const where: Prisma.ReviewWhereInput = {
      ...(search ? { comment: { contains: search, mode: 'insensitive' } } : {}),
      ...(ratingFilter ? { rating: ratingFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {})
    };

    const [items, totalItems, reviewsAggr, reviewsGroup] = await Promise.all([
      prisma.review.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort]: order },
        select: { id: true, rating: true, comment: true, status: true, created_at: true, student: { select: { full_name: true } }, course: { select: { title: true } } }
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({ _avg: { rating: true }, _count: { id: true } }),
      prisma.review.groupBy({ by: ['status'], _count: { id: true } })
    ]);

    let approvedReviews = 0, hiddenReviews = 0;
    // We only have APPROVED and HIDDEN in ReviewStatus.
    reviewsGroup.forEach(g => {
      if (g.status === ReviewStatus.APPROVED) approvedReviews += g._count.id;
      if (g.status === ReviewStatus.HIDDEN) hiddenReviews += g._count.id;
    });

    return {
      summary: {
        averageRating: reviewsAggr._avg.rating ? parseFloat(reviewsAggr._avg.rating.toFixed(2)) : 0,
        totalReviews: reviewsAggr._count.id,
        approvedReviews,
        pendingReviews: 0, // Not in ReviewStatus enum as per schema
        hiddenReviews
      },
      items,
      pagination: {
        page, limit, totalItems,
        totalPages: Math.ceil(totalItems / limit),
        hasNext: page * limit < totalItems,
        hasPrevious: page > 1
      }
    };
  }

  public static async updateReviewStatus(reviewId: string, newStatus: ReviewStatus) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new Error('Review not found');
    if (review.status === newStatus) throw new Error('Conflict: Status already applied');

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { status: newStatus },
      select: { id: true, rating: true, status: true }
    });

    await Promise.all([
      cache.invalidateByTag(CACHE_TAGS.HOME_TOP_RATED),
      cache.invalidateByTag(CACHE_TAGS.HOME_TESTIMONIALS),
    ]);

    return updated;
  }
}
