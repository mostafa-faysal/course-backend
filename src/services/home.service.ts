import { prisma } from '../config/db';
import { cache, CACHE_TTL, CACHE_TAGS } from '../cache';

export class HomeService {
  public static async getPlatformCounts() {
    const [students, courses, instructors, certificates] = await prisma.$transaction([
      prisma.user.count({ where: { role: 'STUDENT', status: 'ACTIVE' } }),
      prisma.course.count({ where: { status: 'PUBLISHED' } }),
      prisma.user.count({ where: { role: 'INSTRUCTOR', status: 'ACTIVE' } }),
      prisma.certificate.count(),
    ]);

    return {
      students,
      courses,
      instructors,
      certificates,
    };
  }

  public static async getHeroData() {
    const cacheKey = 'home:hero';
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const counts = await this.getPlatformCounts();
    const data = {
      title: 'تعلم المهارات التي تصنع مستقبلك',
      subtitle: 'StudyFlow هي منصة تعليمية احترافية تساعدك على اكتساب مهارات البرمجة، الذكاء الاصطناعي، تحليل البيانات، التصميم، وتطوير التطبيقات من خلال مسارات عملية يقودها خبراء الصناعة.',
      primary_button: {
        text: 'ابدأ التعلم',
        url: '/courses',
      },
      secondary_button: {
        text: 'استكشف المسارات',
        url: '/courses#paths',
      },
      hero_image: 'https://res.cloudinary.com/trmszuqg/image/upload/v1785559343/1000149988_gciucp.jpg',
      background_image: 'https://res.cloudinary.com/trmszuqg/image/upload/v1785559343/1000149988_gciucp.jpg',
      students_count: counts.students,
      courses_count: counts.courses,
      instructors_count: counts.instructors,
      rating: 4.9,
    };

    await cache.set(cacheKey, data, CACHE_TTL.HERO, [CACHE_TAGS.HOME_HERO]);
    return data;
  }

  public static async getStatistics() {
    const cacheKey = 'home:statistics';
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const data = await this.getPlatformCounts();
    await cache.set(cacheKey, data, CACHE_TTL.STATISTICS, [CACHE_TAGS.HOME_STATISTICS]);
    return data;
  }

  public static async getPartners() {
    return [
      { name: 'Microsoft Enterprise Ecosystem', category: 'Cloud & Azure Solutions' },
      { name: 'Google Developers & AI AI/ML', category: 'Data Science Infrastructure' },
      { name: 'Amazon Web Services (AWS)', category: 'Cloud Deployment & Docker' },
      { name: 'Meta React Open Source', category: 'Front-End Architecture' },
    ];
  }

  public static async getWhyChooseUs() {
    return [
      { id: 1, title: 'Expert Instructors', description: 'Learn directly from senior industry software developers and system architects.' },
      { id: 2, title: 'Real-World Projects', description: 'Build enterprise portfolio-ready applications designed for the labor market.' },
      { id: 3, title: 'Verifiable Certificates', description: 'Receive unique credential IDs upon diploma graduation valued in tech hiring.' },
      { id: 4, title: 'Lifetime Access & Mentorship', description: 'Access course materials anytime and get continuous code reviews from mentors.' },
    ];
  }

  public static async getSettings() {
    return {
      name: 'StudyFlow',
      logo: 'https://res.cloudinary.com/trmszuqg/image/upload/v1785559347/1000149993_lijztj.jpg',
      support_email: 'support@studyflow.com',
      support_phone: '+20 100 123 4567',
      facebook: 'https://facebook.com/studyflow',
      instagram: 'https://instagram.com/studyflow',
      linkedin: 'https://linkedin.com/company/studyflow',
      youtube: 'https://youtube.com/@studyflow',
      copyright: '© 2026 StudyFlow. All rights reserved.',
    };
  }

  public static async getFooter() {
    return {
      companyName: 'StudyFlow',
      description: 'منصة تعليمية متخصصة في تقديم دبلومات تقنية احترافية تساعد الطلاب على اكتساب المهارات المطلوبة لسوق العمل.',
      email: 'support@studyflow.com',
      phone: '+20 100 123 4567',
      address: 'Cairo, Egypt',
      facebook: 'https://facebook.com/studyflow',
      instagram: 'https://instagram.com/studyflow',
      linkedin: 'https://linkedin.com/company/studyflow',
      youtube: 'https://youtube.com/@studyflow',
    };
  }

  public static async getConfig() {
    const cacheKey = 'home:config';
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const [hero, why_choose_us, partners, footer, settings] = await Promise.all([
      this.getHeroData(),
      this.getWhyChooseUs(),
      this.getPartners(),
      this.getFooter(),
      this.getSettings(),
    ]);

    const data = {
      hero,
      why_choose_us,
      partners,
      footer,
      settings,
    };

    await cache.set(cacheKey, data, CACHE_TTL.CONFIG, [CACHE_TAGS.HOME_CONFIG]);
    return data;
  }

  public static async getCategories() {
    const cacheKey = 'home:categories';
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: { courses: true },
        },
      },
    });

    const data = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      courses_count: cat._count.courses,
    }));

    await cache.set(cacheKey, data, CACHE_TTL.CATEGORIES, [CACHE_TAGS.HOME_CATEGORIES]);
    return data;
  }

  private static formatCourse(c: any) {
    let avgRating = 0.0;
    if (c.reviews && c.reviews.length > 0) {
      const sum = c.reviews.reduce((acc: number, r: any) => acc + r.rating, 0);
      avgRating = Number((sum / c.reviews.length).toFixed(1));
    }

    return {
      id: c.id,
      title: c.title,
      slug: c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      price: c.price,
      discount_price: c.discount_price,
      rating: avgRating,
      reviews_count: c._count?.reviews ?? (c.reviews ? c.reviews.length : 0),
      students_count: c._count?.enrollments ?? 0,
      duration_weeks: c.duration_weeks ? `${c.duration_weeks} أسبوع` : '16 أسبوع',
      duration_hours: c.duration_hours ? `${c.duration_hours} ساعة` : '120 ساعة',
      projects_count: c.projects_count ? `${c.projects_count} مشاريع` : '6 مشاريع',
      card_image: c.card_image || c.thumbnail,
      thumbnail: c.thumbnail,
      instructor: {
        name: c.instructor?.full_name || 'Senior Instructor',
        avatar: c.instructor?.profile_picture || 'https://res.cloudinary.com/trmszuqg/image/upload/v1785557524/1000150013_ylfd3h.jpg',
      },
    };
  }

  public static async getFeaturedCourses() {
    const cacheKey = 'home:featured-courses';
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const courses = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      take: 6,
      select: {
        id: true,
        title: true,
        price: true,
        discount_price: true,
        thumbnail: true,
        card_image: true,
        cover_image: true,
        level: true,
        duration_hours: true,
        duration_weeks: true,
        projects_count: true,
        instructor: {
          select: { full_name: true, profile_picture: true },
        },
        reviews: {
          select: { rating: true },
        },
        _count: {
          select: { enrollments: true, reviews: true },
        },
      },
      orderBy: {
        enrollments: { _count: 'desc' },
      },
    });

    const data = courses.map(this.formatCourse);
    await cache.set(cacheKey, data, CACHE_TTL.FEATURED_COURSES, [CACHE_TAGS.HOME_FEATURED]);
    return data;
  }

  public static async getTopRatedCourses() {
    const cacheKey = 'home:top-rated-courses';
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const courses = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        price: true,
        discount_price: true,
        thumbnail: true,
        card_image: true,
        cover_image: true,
        level: true,
        duration_hours: true,
        duration_weeks: true,
        projects_count: true,
        instructor: {
          select: { full_name: true, profile_picture: true },
        },
        reviews: {
          select: { rating: true },
        },
        _count: {
          select: { enrollments: true, reviews: true },
        },
      },
    });

    const formatted = courses.map(this.formatCourse);
    const data = formatted.sort((a, b) => b.rating - a.rating).slice(0, 6);
    await cache.set(cacheKey, data, CACHE_TTL.TOP_RATED_COURSES, [CACHE_TAGS.HOME_TOP_RATED]);
    return data;
  }

  public static async getPopularCourses() {
    const cacheKey = 'home:popular-courses';
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const courses = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      take: 6,
      select: {
        id: true,
        title: true,
        price: true,
        discount_price: true,
        thumbnail: true,
        card_image: true,
        cover_image: true,
        level: true,
        duration_hours: true,
        duration_weeks: true,
        projects_count: true,
        instructor: {
          select: { full_name: true, profile_picture: true },
        },
        reviews: {
          select: { rating: true },
        },
        _count: {
          select: { enrollments: true, reviews: true },
        },
      },
      orderBy: {
        enrollments: { _count: 'desc' },
      },
    });

    const data = courses.map(this.formatCourse);
    await cache.set(cacheKey, data, CACHE_TTL.POPULAR_COURSES, [CACHE_TAGS.HOME_POPULAR]);
    return data;
  }

  public static async getNewCourses() {
    const cacheKey = 'home:new-courses';
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const courses = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      take: 6,
      select: {
        id: true,
        title: true,
        price: true,
        discount_price: true,
        thumbnail: true,
        card_image: true,
        cover_image: true,
        level: true,
        duration_hours: true,
        duration_weeks: true,
        projects_count: true,
        instructor: {
          select: { full_name: true, profile_picture: true },
        },
        reviews: {
          select: { rating: true },
        },
        _count: {
          select: { enrollments: true, reviews: true },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const data = courses.map(this.formatCourse);
    await cache.set(cacheKey, data, CACHE_TTL.NEW_COURSES, [CACHE_TAGS.HOME_NEW]);
    return data;
  }

  public static async getTopInstructors() {
    const cacheKey = 'home:top-instructors';
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const instructors = await prisma.user.findMany({
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
        courses_taught: {
          select: {
            _count: {
              select: { enrollments: true },
            },
            reviews: {
              select: { rating: true },
            },
          },
        },
        _count: {
          select: { courses_taught: true },
        },
      },
      orderBy: {
        courses_taught: { _count: 'desc' },
      },
    });

    const data = instructors.map((i) => {
      const totalStudents = i.courses_taught.reduce((acc, course) => acc + course._count.enrollments, 0);
      const allReviews = i.courses_taught.flatMap((course) => course.reviews);
      const avgRating = allReviews.length > 0
        ? Number((allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length).toFixed(1))
        : 5.0;

      return {
        id: i.id,
        name: i.full_name,
        avatar: i.profile_picture || 'https://res.cloudinary.com/trmszuqg/image/upload/v1785557524/1000150013_ylfd3h.jpg',
        title: i.bio ? i.bio.split('.')[0] : 'Senior Software Engineer & Mentor',
        courses_count: i._count.courses_taught || 0,
        students_count: totalStudents,
        rating: avgRating,
      };
    });

    await cache.set(cacheKey, data, CACHE_TTL.TOP_INSTRUCTORS, [CACHE_TAGS.HOME_INSTRUCTORS]);
    return data;
  }

  public static async getTestimonials() {
    const cacheKey = 'home:testimonials';
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const reviews = await prisma.review.findMany({
      where: {
        status: 'APPROVED',
        rating: { gte: 4 },
      },
      take: 6,
      select: {
        id: true,
        rating: true,
        comment: true,
        created_at: true,
        student: {
          select: { full_name: true, profile_picture: true, bio: true },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const data = reviews.map((r) => ({
      id: r.id,
      name: r.student.full_name,
      job_title: r.student.bio || 'Software Engineer & Diploma Graduate',
      avatar: r.student.profile_picture || 'https://res.cloudinary.com/trmszuqg/image/upload/v1785557524/1000150013_ylfd3h.jpg',
      rating: r.rating,
      comment: r.comment || 'من أفضل الدبلومات اللي أهلتني لسوق العمل مباشرة.',
    }));

    await cache.set(cacheKey, data, CACHE_TTL.TESTIMONIALS, [CACHE_TAGS.HOME_TESTIMONIALS]);
    return data;
  }

  public static async getFAQ() {
    const cacheKey = 'home:faq';
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const data = [
      {
        question: 'هل الدبلومات مناسبة للمبتدئين؟',
        answer: 'نعم، جميع الدبلومات تبدأ من الأساسيات ثم تتدرج حتى المستوى الاحترافي.',
      },
      {
        question: 'هل يوجد Mentor أثناء الدراسة؟',
        answer: 'نعم، يتم متابعة كل طالب بواسطة Mentor متخصص مع تقديم Feedback مستمر.',
      },
      {
        question: 'هل أحصل على شهادة بعد الانتهاء؟',
        answer: 'نعم، يحصل الطالب على شهادة إتمام بعد إنهاء متطلبات الدبلومة بنجاح.',
      },
      {
        question: 'هل الدراسة أونلاين؟',
        answer: 'يمكنك متابعة المحتوى بالكامل أونلاين من أي مكان وفي أي وقت.',
      },
      {
        question: 'هل يوجد مشاريع عملية؟',
        answer: 'نعم، كل دبلومة تحتوي على مشاريع عملية تحاكي بيئة العمل الحقيقية.',
      },
    ];

    await cache.set(cacheKey, data, CACHE_TTL.FAQ, [CACHE_TAGS.HOME_FAQ]);
    return data;
  }

  public static async getSearchSuggestions(query?: string) {
    const cleanQuery = (query || '').trim();
    const cacheKey = cleanQuery ? `search-suggest:${cleanQuery.toLowerCase()}` : `search-suggest:popular-default`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    let courses;
    if (!cleanQuery) {
      // Return Top 5 Popular Courses when query is empty
      courses = await prisma.course.findMany({
        where: { status: 'PUBLISHED' },
        take: 5,
        select: {
          id: true,
          title: true,
          price: true,
          card_image: true,
          thumbnail: true,
        },
        orderBy: {
          enrollments: { _count: 'desc' },
        },
      });
    } else {
      // Search inside title only (high speed & best practice for autocomplete)
      courses = await prisma.course.findMany({
        where: {
          status: 'PUBLISHED',
          title: { contains: cleanQuery, mode: 'insensitive' },
        },
        take: 5,
        select: {
          id: true,
          title: true,
          price: true,
          card_image: true,
          thumbnail: true,
        },
      });
    }

    const data = courses.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      card_image: c.card_image || c.thumbnail,
      price: c.price,
    }));

    await cache.set(cacheKey, data, CACHE_TTL.SEARCH_SUGGESTIONS, [CACHE_TAGS.SEARCH_SUGGESTIONS]);
    return data;
  }
}
