"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const express_1 = require("express");
const category_service_1 = require("../services/category.service");
class CategoryController {
    static async getAllCategories(req, res, next) {
        try {
            const categories = await category_service_1.CategoryService.getAllCategories();
            res.status(200).json({ status: 'success', data: categories });
        }
        catch (error) {
            next(error);
        }
    }
    static async getCategoryById(req, res, next) {
        try {
            const category = await category_service_1.CategoryService.getCategoryById(req.params.id);
            if (!category) {
                return res.status(404).json({ status: 'error', message: 'Category not found' });
            }
            res.status(200).json({ status: 'success', data: category });
        }
        catch (error) {
            next(error);
        }
    }
    static async createCategory(req, res, next) {
        try {
            const newCategory = await category_service_1.CategoryService.createCategory(req.body);
            res.status(201).json({ status: 'success', data: newCategory });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateCategory(req, res, next) {
        try {
            // Check if exists first
            const existing = await category_service_1.CategoryService.getCategoryById(req.params.id);
            if (!existing) {
                return res.status(404).json({ status: 'error', message: 'Category not found' });
            }
            const updatedCategory = await category_service_1.CategoryService.updateCategory(req.params.id, req.body);
            res.status(200).json({ status: 'success', data: updatedCategory });
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteCategory(req, res, next) {
        try {
            const existing = await category_service_1.CategoryService.getCategoryById(req.params.id);
            if (!existing) {
                return res.status(404).json({ status: 'error', message: 'Category not found' });
            }
            await category_service_1.CategoryService.deleteCategory(req.params.id);
            res.status(204).send(); // 204 No Content
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CategoryController = CategoryController;
//# sourceMappingURL=category.controller.js.map