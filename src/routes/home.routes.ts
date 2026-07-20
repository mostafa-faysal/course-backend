import { Router } from 'express';
import { HomeController } from '../controllers/home.controller';

const router = Router();

// Aggregated Endpoint
router.get('/', HomeController.getHomeData);

// Individual Endpoints
router.get('/hero', HomeController.getHero);
router.get('/categories', HomeController.getCategories);
router.get('/featured-courses', HomeController.getFeaturedCourses);
router.get('/top-instructors', HomeController.getTopInstructors);
router.get('/statistics', HomeController.getStatistics);
router.get('/testimonials', HomeController.getTestimonials);
router.get('/faq', HomeController.getFAQ);
router.get('/footer', HomeController.getFooter);

export default router;
