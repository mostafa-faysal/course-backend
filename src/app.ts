import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middlewares/error.middleware';
import homeRoutes from './routes/home.routes';
import categoryRoutes from './routes/category.routes';
import courseRoutes from './routes/course.routes';
import enrollmentRoutes from './routes/enrollment.routes';
import { setupSwagger } from './config/swagger';

const app: Application = express();

// Security Middlewares
app.use(helmet());
app.use(cors());

// Body Parsing Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Swagger Documentation
setupSwagger(app);

// Basic Health Check Route
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'success', message: 'API is running successfully' });
});

// Routes
app.use('/api/home', homeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api', enrollmentRoutes);

// Global Error Handling Middleware
app.use(errorHandler);

export default app;
