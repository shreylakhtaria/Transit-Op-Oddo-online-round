import { Router } from 'express';
import { AuthController } from './controller.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/verify-otp', AuthController.verifyOtp);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.get('/me', requireAuth, AuthController.me);

export default router;
