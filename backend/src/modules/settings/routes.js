import { Router } from 'express';
import { SettingsController } from './controller.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import { requireRole } from '../../middlewares/roleMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/settings', SettingsController.getSettings);
router.put('/settings', requireRole(['Fleet Manager']), SettingsController.updateSettings);

export default router;
