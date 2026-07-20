import { prisma } from '../config/db';

export class HomeService {
  public static async getHeroData() {
    // Mock data for Hero section
    return {
      title: 'Master Your Future with Our Online Courses',
      description: 'Learn from the best instructors around the world and upgrade your skills.',
      heroImage: 'https://example.com/hero-image.jpg',
      exploreUrl: '/courses',
    };
  }

  public static async getCategories() {
    return prisma.category.findMany({
      select: {
        id: true,
        name: true,
        icon: true,
        _count: {
          select: { courses: true },
        },
      },
    });
  }

  public static async getFeaturedCourses() {
    return prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
      },
      take: 8,
      include: {
        instructor: {
          select: { full_name: true, profile_picture: true },
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        enrollments: { _count: 'desc' },
      },
    });
  }

  public static async getTopInstructors() {
    return prisma.user.findMany({
      where: {
        role: 'INSTRUCTOR',
        status: 'ACTIVE',
      },
      take: 4,
      select: {
        id: true,
        full_name: true,
        profile_picture: true,
        bio: true,
        _count: {
          select: { courses_taught: true },
        },
      },
      orderBy: {
        courses_taught: { _count: 'desc' },
      },
    });
  }

  public static async getTestimonials() {
    return prisma.review.findMany({
      where: {
        status: 'APPROVED',
        rating: { gte: 4 },
      },
      take: 6,
      include: {
        student: {
          select: { full_name: true, profile_picture: true },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  public static async getStatistics() {
    const [totalUsers, totalCourses, totalEnrollments] = await prisma.$transaction([
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.course.count({ where: { status: 'PUBLISHED' } }),
      prisma.enrollment.count(),
    ]);

    return {
      totalUsers,
      totalCourses,
      totalEnrollments,
    };
  }

  public static async getFAQ() {
    // Mock data for FAQ
    return [
      { question: 'How do I enroll?', answer: 'Simply sign up and click on "Add to Cart".' },
      { question: 'Do you offer certificates?', answer: 'Yes, after completing a course, you will receive a verifiable certificate.' },
      { question: 'Is there a refund policy?', answer: 'Yes, we offer a 30-day money-back guarantee.' },
    ];
  }

  public static async getFooter() {
    return {
      logo: 'https://example.com/logo.png',
      description: 'The best platform for online learning.',
      socialLinks: {
        facebook: 'https://facebook.com',
        twitter: 'https://twitter.com',
        linkedin: 'https://linkedin.com',
      },
    };
  }
}
