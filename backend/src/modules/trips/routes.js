import { Router } from 'express';
import { TripController } from './controller.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import { requireRole } from '../../middlewares/roleMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/trips', TripController.getAllTrips);
router.get('/trips/dispatchable-assets', TripController.getDispatchableAssets);
router.get('/trips/:id', TripController.getTripById);

// Trip dispatch lifecycle operations are restricted to Drivers and Fleet Managers
router.post('/trips', requireRole(['Driver', 'Fleet Manager']), TripController.createTrip);
router.post('/trips/:id/dispatch', requireRole(['Driver', 'Fleet Manager']), TripController.dispatchTrip);
router.post('/trips/:id/complete', requireRole(['Driver', 'Fleet Manager']), TripController.completeTrip);
router.post('/trips/:id/cancel', requireRole(['Driver', 'Fleet Manager']), TripController.cancelTrip);

export default router;
