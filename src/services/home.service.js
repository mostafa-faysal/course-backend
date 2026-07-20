"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeService = void 0;
const db_1 = require("../config/db");
class HomeService {
    static async getHeroData() {
        // Mock data for Hero section
        return {
            title: 'Master Your Future with Our Online Courses',
            description: 'Learn from the best instructors around the world and upgrade your skills.',
            heroImage: 'https://example.com/hero-image.jpg',
            exploreUrl: '/courses',
        };
    }
    static async getCategories() {
        return db_1.prisma.category.findMany({
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
    static async getFeaturedCourses() {
        return db_1.prisma.course.findMany({
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
                        lessons: true,
                    },
                },
            },
            orderBy: {
                enrollments: { _count: 'desc' },
            },
        });
    }
    static async getTopInstructors() {
        return db_1.prisma.user.findMany({
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
    static async getTestimonials() {
        return db_1.prisma.review.findMany({
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
    static async getStatistics() {
        const [totalUsers, totalCourses, totalEnrollments] = await db_1.prisma.$transaction([
            db_1.prisma.user.count({ where: { status: 'ACTIVE' } }),
            db_1.prisma.course.count({ where: { status: 'PUBLISHED' } }),
            db_1.prisma.enrollment.count(),
        ]);
        return {
            totalUsers,
            totalCourses,
            totalEnrollments,
        };
    }
    static async getFAQ() {
        // Mock data for FAQ
        return [
            { question: 'How do I enroll?', answer: 'Simply sign up and click on "Add to Cart".' },
            { question: 'Do you offer certificates?', answer: 'Yes, after completing a course, you will receive a verifiable certificate.' },
            { question: 'Is there a refund policy?', answer: 'Yes, we offer a 30-day money-back guarantee.' },
        ];
    }
    static async getFooter() {
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
exports.HomeService = HomeService;
//# sourceMappingURL=home.service.js.map