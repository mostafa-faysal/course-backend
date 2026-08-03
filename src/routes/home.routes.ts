import { Router } from 'express';
import { HomeController } from '../controllers/home.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Home
 *   description: الصفحة الرئيسية للمنصة (نظام التحميل المتقدم والبيانات الحركية مع الكاش)
 */

/**
 * @swagger
 * /api/home:
 *   get:
 *     summary: Get lightweight global structural config (Shell)
 *     description: يجلب البيانات الثابتة والأساسية للصفحة الرئيسية (Hero, Why Choose Us, Partners, Footer, Settings) في طلب واحد لضمان أسرع وقت تحميل بدون انتظار معالجة الكورسات والتقييمات.
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Global structural shell data retrieved successfully
 */
router.get('/', HomeController.getHomeData);

/**
 * @swagger
 * /api/home/config:
 *   get:
 *     summary: Get static structural configuration
 *     description: يجلب كافة الإعدادات والبيانات الثابتة للصفحة الرئيسية (Hero, Why Choose Us, Partners, Footer, Settings) لدعم تجربة تحميل فورية (Zero Manual Data).
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Config data retrieved successfully
 */
router.get('/config', HomeController.getConfig);

/**
 * @swagger
 * /api/home/search-suggestions:
 *   get:
 *     summary: Get search bar autocomplete suggestions
 *     description: يجلب اقتراحات البحث الفورية لشريط البحث في الفرونت إند. عند فراغ الاستعلام (Empty query) يعيد أعلى 5 كورسات شعبية ومبيعاً، وعند الكتابة الفورية يفرز العناوين (Title only) للحصول على أقصى سرعة استجابة.
 *     tags: [Home]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: نص البحث الفوري في شريط البحث
 *     responses:
 *       200:
 *         description: Search suggestions retrieved successfully
 */
router.get('/search-suggestions', HomeController.getSearchSuggestions);

/**
 * @swagger
 * /api/home/hero:
 *   get:
 *     summary: Get Hero section data
 *     description: يجلب بيانات القسم الأول في الصفحة الرئيسية (Hero Section) والذي يتضمن العنوان الرئيسي، الوصف، وإحصائيات الطلاب والكورسات السريعة.
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Hero data retrieved successfully
 */
router.get('/hero', HomeController.getHero);

/**
 * @swagger
 * /api/home/partners:
 *   get:
 *     summary: Get platform technology partners
 *     description: يجلب قائمة بالشركات التكنولوجية والشركاء (Partners & Ecosystems) التي تتعاون معها المنصة لزيادة الثقة والاعتماديّة.
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Partners retrieved successfully
 */
router.get('/partners', HomeController.getPartners);

/**
 * @swagger
 * /api/home/why-choose-us:
 *   get:
 *     summary: Get Platform Features (Why Choose Us)
 *     description: يجلب مزايا المنصة والمميزات الخاصة بها لتعزيز المصداقية والتعرف على طرق التدريس والتطبيق العملي.
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Why Choose Us features retrieved successfully
 */
router.get('/why-choose-us', HomeController.getWhyChooseUs);
router.get('/platform', HomeController.getWhyChooseUs); // Backward compatible alias

/**
 * @swagger
 * /api/home/categories:
 *   get:
 *     summary: Get top categories
 *     description: يجلب قائمة بأهم التصنيفات (Categories) مع عدد الكورسات المتاحة في كل تصنيف. يستخدم في الصفحة الرئيسية لعرض الأقسام الشائعة للطلاب للبحث والتصفح السريع.
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */
router.get('/categories', HomeController.getCategories);

/**
 * @swagger
 * /api/home/featured-courses:
 *   get:
 *     summary: Get featured courses
 *     description: يجلب قائمة بالدبلومات المميزة والأكثر تفاعلاً على المنصة لعرضها في قسم المختار لكم.
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Featured courses retrieved successfully
 */
router.get('/featured-courses', HomeController.getFeaturedCourses);

/**
 * @swagger
 * /api/home/top-rated-courses:
 *   get:
 *     summary: Get top rated courses
 *     description: يجلب قائمة الكورسات الأعلى تقييماً بناءً على التقييم الفعلي لطلاب المنصة (من جدول التقييمات في قاعدة البيانات)، مرتبة تنازلياً حسب متوسط التقييم.
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Top rated courses retrieved successfully
 */
router.get('/top-rated-courses', HomeController.getTopRatedCourses);

/**
 * @swagger
 * /api/home/popular-courses:
 *   get:
 *     summary: Get popular courses by enrollment volume
 *     description: يجلب قائمة الكورسات الأكثر شعبية وإقبالاً بناءً على عدد التسجيلات الفعلية (Enrollments count) في قاعدة البيانات.
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Popular courses retrieved successfully
 */
router.get('/popular-courses', HomeController.getPopularCourses);

/**
 * @swagger
 * /api/home/new-courses:
 *   get:
 *     summary: Get newest published courses
 *     description: يجلب أحدث الدبلومات التي تم إضافتها ونشرها على المنصة، مرتبة حسب تاريخ الإنشاء.
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Newest courses retrieved successfully
 */
router.get('/new-courses', HomeController.getNewCourses);

/**
 * @swagger
 * /api/home/top-instructors:
 *   get:
 *     summary: Get top instructors
 *     description: يجلب بيانات أفضل المدربين في المنصة بناءً على التقييمات وعدد الطلاب والتدريس الفعلي في قاعدة البيانات.
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Top instructors retrieved successfully
 */
router.get('/top-instructors', HomeController.getTopInstructors);

/**
 * @swagger
 * /api/home/statistics:
 *   get:
 *     summary: Get platform statistics
 *     description: يجلب إحصائيات عامة عن المنصة مثل (إجمالي الكورسات، عدد الطلاب النشطين، إجمالي المدربين، وعدد الشهادات المصدرة).
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/statistics', HomeController.getStatistics);

/**
 * @swagger
 * /api/home/testimonials:
 *   get:
 *     summary: Get student testimonials
 *     description: يجلب آراء وتقييمات الطلاب الحقيقيين المسجلين في المنصة والموجودة في جدول التقييمات (Reviews) بقاعدة البيانات.
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Testimonials retrieved successfully
 */
router.get('/testimonials', HomeController.getTestimonials);

/**
 * @swagger
 * /api/home/faq:
 *   get:
 *     summary: Get FAQs
 *     description: يجلب الأسئلة الشائعة وإجاباتها للرد على استفسارات الزوار المعتادة في الصفحة الرئيسية.
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: FAQs retrieved successfully
 */
router.get('/faq', HomeController.getFAQ);

/**
 * @swagger
 * /api/home/settings:
 *   get:
 *     summary: Get Site Settings metadata and social info
 *     description: يجلب البيانات العامة والمؤسسية للمنصة (الاسم، الشعار، أرقام التواصل وروابط حسابات السوشيال ميديا) لتجنب تثبيتها يدوياً في الفرونت إند.
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Site settings retrieved successfully
 */
router.get('/settings', HomeController.getSettings);
router.get('/platform-info', HomeController.getSettings); // Backward compatible alias

/**
 * @swagger
 * /api/home/footer:
 *   get:
 *     summary: Get footer links
 *     description: يجلب الروابط السريعة، معلومات التواصل، وروابط السوشيال ميديا الخاصة بأسفل الصفحة (Footer). 
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Footer data retrieved successfully
 */
router.get('/footer', HomeController.getFooter);

export default router;

