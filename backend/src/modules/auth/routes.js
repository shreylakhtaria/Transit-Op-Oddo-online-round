import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from './controller.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import { requireRole } from '../../middlewares/roleMiddleware.js';
import { env } from '../../config/env.js';

const router = Router();

// Rate limiter for auth endpoints.
//
// Two demo-relevant caveats:
//  - Behind Vercel's proxy every request can look like it comes from one IP, so this
//    limit is effectively shared across all users — 10 total sign-ins would lock out
//    the whole demo for 15 minutes.
//  - A shared-account demo means many people hammering /login and /verify-otp.
// So in demo mode (EXPOSE_OTP) the limiter is skipped entirely. A real deployment keeps it.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // per window
  message: { error: 'Too many authentication attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.EXPOSE_OTP,
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
