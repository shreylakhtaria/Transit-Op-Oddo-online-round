import { Router } from 'express';
import { MaintenanceController } from './controller.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import { requireRole } from '../../middlewares/roleMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/maintenance', MaintenanceController.getAllLogs);

// Creating and closing maintenance logs is restricted to Fleet Managers
router.post('/maintenance', requireRole(['Fleet Manager']), MaintenanceController.startMaintenance);
router.post('/maintenance/:id/close', requireRole(['Fleet Manager']), MaintenanceController.closeMaintenance);

export default router;
