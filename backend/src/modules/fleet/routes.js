import { Router } from 'express';
import { FleetController } from './controller.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import { requireRole } from '../../middlewares/roleMiddleware.js';

const router = Router();

// All fleet endpoints require authentication
router.use(requireAuth);

// Vehicles
router.get('/vehicles', FleetController.getAllVehicles);
router.get('/vehicles/:id', FleetController.getVehicleById);
router.post('/vehicles', requireRole(['Fleet Manager']), FleetController.createVehicle);
router.put('/vehicles/:id', requireRole(['Fleet Manager']), FleetController.updateVehicle);
router.delete('/vehicles/:id', requireRole(['Fleet Manager']), FleetController.deleteVehicle);

// Drivers
router.get('/drivers', FleetController.getAllDrivers);
router.get('/drivers/:id', FleetController.getDriverById);
router.post('/drivers', requireRole(['Fleet Manager', 'Safety Officer']), FleetController.createDriver);
router.put('/drivers/:id', requireRole(['Fleet Manager', 'Safety Officer']), FleetController.updateDriver);
router.delete('/drivers/:id', requireRole(['Fleet Manager', 'Safety Officer']), FleetController.deleteDriver);
router.post('/drivers/remind-expiry', requireRole(['Fleet Manager', 'Safety Officer']), FleetController.sendLicenseExpiryReminders);

// Vehicle Documents
router.get('/vehicles/:id/documents', FleetController.getVehicleDocuments);
router.post('/vehicles/:id/documents', requireRole(['Fleet Manager']), FleetController.addVehicleDocument);
router.delete('/vehicles/:id/documents/:docId', requireRole(['Fleet Manager']), FleetController.deleteVehicleDocument);

export default router;
