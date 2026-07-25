import { Router } from 'express';
import { HomeController } from '../controllers/home.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Home
 *   description: الصفحة الرئيسية للمنصة
 */

/**
 * @swagger
 * /api/home:
 *   get:
 *     summary: Get all home page data (Aggregated)
 *     description: هذا الـ API مخصص لجلب كافة بيانات الصفحة الرئيسية (Hero, Categories, Featured Courses, Top Instructors, Statistics, Testimonials) في طلب واحد (Single Request). تم إنشاؤه لتقليل عدد الـ Requests من الفرونت اند وتحسين سرعة تحميل الصفحة الرئيسية (Fast Initial Load).
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Home data retrieved successfully
 */
router.get('/', HomeController.getHomeData);

/**
 * @swagger
 * /api/home/hero:
 *   get:
 *     summary: Get Hero section data
 *     description: يجلب بيانات القسم الأول في الصفحة الرئيسية (Hero Section) والذي يتضمن العنوان الرئيسي، الوصف، والروابط السريعة. مخصص للفرونت اند في حال الرغبة بتحميل هذا الجزء بشكل منفصل.
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Hero data retrieved
 */
router.get('/hero', HomeController.getHero);

/**
 * @swagger
 * /api/home/categories:
 *   get:
 *     summary: Get top categories
 *     description: يجلب قائمة بأهم التصنيفات (Categories) مع عدد الكورسات المتاحة في كل تصنيف. يستخدم في الصفحة الرئيسية لعرض الأقسام الشائعة للطلاب للبحث والتصفح السريع.
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Categories retrieved
 */
router.get('/categories', HomeController.getCategories);

/**
 * @swagger
 * /api/home/featured-courses:
 *   get:
 *     summary: Get featured courses
 *     description: يجلب قائمة بأفضل أو أحدث الكورسات المميزة. يستخدم في الفرونت اند لعرض شريط تمرير (Carousel) يلفت انتباه الطالب للكورسات الأعلى تقييماً أو الأكثر مبيعاً.
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Featured courses retrieved
 */
router.get('/featured-courses', HomeController.getFeaturedCourses);

/**
 * @swagger
 * /api/home/top-instructors:
 *   get:
 *     summary: Get top instructors
 *     description: يجلب بيانات أفضل المدربين في المنصة بناءً على التقييمات وعدد الطلاب. مفيد في الصفحة الرئيسية لزيادة الثقة (Social Proof) وتشجيع الطلاب على التسجيل.
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Top instructors retrieved
 */
router.get('/top-instructors', HomeController.getTopInstructors);

/**
 * @swagger
 * /api/home/statistics:
 *   get:
 *     summary: Get platform statistics
 *     description: يجلب إحصائيات عامة عن المنصة مثل (إجمالي الكورسات، عدد الطلاب النشطين، إجمالي المدربين). تُستخدم في الفرونت اند في قسم الأرقام لتعزيز مصداقية المنصة أمام الزوار.
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Statistics retrieved
 */
router.get('/statistics', HomeController.getStatistics);

/**
 * @swagger
 * /api/home/testimonials:
 *   get:
 *     summary: Get student testimonials
 *     description: يجلب آراء وتقييمات الطلاب السابقين. يستخدم في الفرونت اند لزيادة الثقة والمبيعات (Testimonials Section).
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Testimonials retrieved
 */
router.get('/testimonials', HomeController.getTestimonials);

/**
 * @swagger
 * /api/home/faq:
 *   get:
 *     summary: Get FAQs
 *     description: يجلب الأسئلة الشائعة وإجاباتها. يستخدم في صفحة الأسئلة الشائعة أو في نهاية الصفحة الرئيسية للرد على استفسارات الزوار المعتادة.
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: FAQs retrieved
 */
router.get('/faq', HomeController.getFAQ);

/**
 * @swagger
 * /api/home/footer:
 *   get:
 *     summary: Get footer links
 *     description: يجلب الروابط السريعة، معلومات التواصل، وروابط السوشيال ميديا الخاصة بأسفل الصفحة (Footer). 
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Footer data retrieved
 */
router.get('/footer', HomeController.getFooter);

export default router;
