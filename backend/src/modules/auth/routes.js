import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from './controller.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';

const router = Router();

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per `window` (here, per 15 minutes)
  message: { error: 'Too many authentication attempts, please try again after 15 minutes' },
  standardHeaders: true, 
  legacyHeaders: false, 
});

router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.post('/verify-otp', authLimiter, AuthController.verifyOtp);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.get('/me', requireAuth, AuthController.me);

export default router;
