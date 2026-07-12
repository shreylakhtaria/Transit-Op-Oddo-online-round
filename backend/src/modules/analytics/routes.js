import { Router } from 'express';
import { AnalyticsController } from './controller.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/analytics/dashboard', AnalyticsController.getDashboardStats);
router.get('/analytics/monthly-revenue', AnalyticsController.getMonthlyRevenue);
router.get('/analytics/top-costliest', AnalyticsController.getTopCostliestVehicles);
router.get('/analytics/export/csv', AnalyticsController.exportCSV);

export default router;
