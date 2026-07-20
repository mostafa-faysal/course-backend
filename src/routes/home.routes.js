"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const home_controller_1 = require("../controllers/home.controller");
const router = (0, express_1.Router)();
// Aggregated Endpoint
router.get('/', home_controller_1.HomeController.getHomeData);
// Individual Endpoints
router.get('/hero', home_controller_1.HomeController.getHero);
router.get('/categories', home_controller_1.HomeController.getCategories);
router.get('/featured-courses', home_controller_1.HomeController.getFeaturedCourses);
router.get('/top-instructors', home_controller_1.HomeController.getTopInstructors);
router.get('/statistics', home_controller_1.HomeController.getStatistics);
router.get('/testimonials', home_controller_1.HomeController.getTestimonials);
router.get('/faq', home_controller_1.HomeController.getFAQ);
router.get('/footer', home_controller_1.HomeController.getFooter);
exports.default = router;
//# sourceMappingURL=home.routes.js.map