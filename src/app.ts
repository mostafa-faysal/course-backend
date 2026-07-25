import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { errorHandler } from './middlewares/error.middleware';
import { requestIdMiddleware } from './middlewares/request-id.middleware';
import { globalRateLimiter } from './middlewares/rate-limit.middleware';
import { config } from './config/env';
import healthRoutes from './routes/health.routes';
import homeRoutes from './routes/home.routes';
import categoryRoutes from './routes/category.routes';
import courseRoutes from './routes/course.routes';
import enrollmentRoutes from './routes/enrollment.routes';
import progressRoutes from './routes/progress.routes';
import favoriteRoutes from './routes/favorite.routes';
import cartRoutes from './routes/cart.routes';
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import instructorRoutes from './routes/instructor.routes';
import adminRoutes from './routes/admin.routes';
import learningPlanRoutes from './routes/learning-plan.routes';
import authRoutes from './routes/auth.routes';
import { instructorAssignmentRoutes, studentAssignmentRoutes } from './routes/assignment.routes';
import userRoutes from './routes/user.routes';
import studentDashboardRoutes from './routes/student-dashboard.routes';
import notificationRoutes from './routes/notification.routes';
import { setupSwagger } from './config/swagger';

const app: Application = express();

// Request Correlation Middleware
app.use(requestIdMiddleware);

// Security & Optimization Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    frameguard: { action: 'deny' },
  })
);

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  })
);

app.use(compression());
app.use(globalRateLimiter);

// Body Parsing Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Swagger Documentation
setupSwagger(app);

// Health Check Routes
app.use('/api/health', healthRoutes);
app.use('/health', healthRoutes);

// Routes (Existing API Structure Kept Exactly As Is)
app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api', enrollmentRoutes);
app.use('/api/courses/:courseId/progress', progressRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/student/dashboard', studentDashboardRoutes);
app.use('/api/student/learning-plan', learningPlanRoutes);
app.use('/api/instructor', instructorAssignmentRoutes);
app.use('/api/student', studentAssignmentRoutes);
app.use('/api/notifications', notificationRoutes);

// Global Error Handling Middleware
app.use(errorHandler);

export default app;

