"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategorySchema = exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
exports.createCategorySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters long'),
        icon: zod_1.z.string().url('Icon must be a valid URL').optional(),
    }),
});
exports.updateCategorySchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid category ID format'),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters long').optional(),
        icon: zod_1.z.string().url('Icon must be a valid URL').optional(),
    }),
});
exports.getCategorySchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid category ID format'),
    }),
});
//# sourceMappingURL=category.schema.js.map