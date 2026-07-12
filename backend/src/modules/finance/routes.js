import { Router } from 'express';
import { FinanceController } from './controller.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import { requireRole } from '../../middlewares/roleMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/expenses', FinanceController.getAllExpenses);
router.get('/expenses/fuel', FinanceController.getFuelLogs);
router.get('/expenses/vehicle/:vehicleId', FinanceController.getVehicleOperationalCost);

// Expense / Fuel logging is restricted to Fleet Managers and Financial Analysts
router.post('/expenses/fuel', requireRole(['Fleet Manager', 'Financial Analyst']), FinanceController.logFuel);
router.post('/expenses/other', requireRole(['Fleet Manager', 'Financial Analyst']), FinanceController.logExpense);

export default router;
