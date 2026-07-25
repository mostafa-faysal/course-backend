import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: API and Database Health Check
 *     description: Checks the status of the Express server and database connectivity. Returns HTTP 503 if the database is unreachable.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server and database are operating normally
 *       503:
 *         description: Database is disconnected or unreachable
 */
router.get('/', HealthController.check);

export default router;
