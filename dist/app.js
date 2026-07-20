"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const error_middleware_1 = require("./middlewares/error.middleware");
const home_routes_1 = __importDefault(require("./routes/home.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const swagger_1 = require("./config/swagger");
const app = (0, express_1.default)();
// Security Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
// Body Parsing Middlewares
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Setup Swagger Documentation
(0, swagger_1.setupSwagger)(app);
// Basic Health Check Route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'API is running successfully' });
});
// Routes
app.use('/api/home', home_routes_1.default);
app.use('/api/categories', category_routes_1.default);
// Global Error Handling Middleware
app.use(error_middleware_1.errorHandler);
exports.default = app;
