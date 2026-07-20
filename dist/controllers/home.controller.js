"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeController = void 0;
const home_service_1 = require("../services/home.service");
class HomeController {
    // 1. Aggregated Endpoint
    static async getHomeData(req, res, next) {
        try {
            const [hero, categories, featuredCourses, topInstructors, testimonials, statistics, faq, footer,] = await Promise.all([
                home_service_1.HomeService.getHeroData(),
                home_service_1.HomeService.getCategories(),
                home_service_1.HomeService.getFeaturedCourses(),
                home_service_1.HomeService.getTopInstructors(),
                home_service_1.HomeService.getTestimonials(),
                home_service_1.HomeService.getStatistics(),
                home_service_1.HomeService.getFAQ(),
                home_service_1.HomeService.getFooter(),
            ]);
            res.status(200).json({
                status: 'success',
                data: { hero, categories, featuredCourses, topInstructors, testimonials, statistics, faq, footer },
            });
        }
        catch (error) {
            next(error);
        }
    }
    // 2. Individual Endpoints
    static async getHero(req, res, next) {
        try {
            const data = await home_service_1.HomeService.getHeroData();
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    }
    static async getCategories(req, res, next) {
        try {
            const data = await home_service_1.HomeService.getCategories();
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    }
    static async getFeaturedCourses(req, res, next) {
        try {
            const data = await home_service_1.HomeService.getFeaturedCourses();
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    }
    static async getTopInstructors(req, res, next) {
        try {
            const data = await home_service_1.HomeService.getTopInstructors();
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    }
    static async getStatistics(req, res, next) {
        try {
            const data = await home_service_1.HomeService.getStatistics();
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    }
    static async getTestimonials(req, res, next) {
        try {
            const data = await home_service_1.HomeService.getTestimonials();
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    }
    static async getFAQ(req, res, next) {
        try {
            const data = await home_service_1.HomeService.getFAQ();
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    }
    static async getFooter(req, res, next) {
        try {
            const data = await home_service_1.HomeService.getFooter();
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.HomeController = HomeController;
