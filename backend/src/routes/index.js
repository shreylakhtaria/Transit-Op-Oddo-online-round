import { Router } from 'express';
import authRoutes from '../modules/auth/routes.js';
import fleetRoutes from '../modules/fleet/routes.js';
import tripRoutes from '../modules/trips/routes.js';
import maintenanceRoutes from '../modules/maintenance/routes.js';
import financeRoutes from '../modules/finance/routes.js';
import analyticsRoutes from '../modules/analytics/routes.js';
import settingsRoutes from '../modules/settings/routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/', fleetRoutes);
router.use('/', tripRoutes);
router.use('/', maintenanceRoutes);
router.use('/', financeRoutes);
router.use('/', analyticsRoutes);
router.use('/', settingsRoutes);

export default router;
