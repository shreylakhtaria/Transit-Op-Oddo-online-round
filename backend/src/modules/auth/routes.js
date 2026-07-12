import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from './controller.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import { requireRole } from '../../middlewares/roleMiddleware.js';

const router = Router();

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per `window` (here, per 15 minutes)
  message: { error: 'Too many authentication attempts, please try again after 15 minutes' },
  standardHeaders: true, 
  legacyHeaders: false, 
});

// Registration mints accounts and accepts a client-supplied `roleName` (including
// 'Fleet Manager'), so it must never be reachable anonymously — that would let any caller
// grant themselves admin. Only an authenticated Fleet Manager may create users; the
// initial accounts come from the database seeders, so there is no bootstrap problem.
router.post('/register', authLimiter, requireAuth, requireRole(['Fleet Manager']), AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.post('/verify-otp', authLimiter, AuthController.verifyOtp);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.get('/me', requireAuth, AuthController.me);

export default router;
