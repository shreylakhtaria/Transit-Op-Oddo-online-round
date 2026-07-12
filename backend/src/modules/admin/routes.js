import { Router } from 'express';
import { AdminController } from './controller.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import { requireRole } from '../../middlewares/roleMiddleware.js';

const router = Router();

// All admin endpoints require authentication
router.use(requireAuth);

// Roles
// Readable by any authenticated user — the RBAC screen renders the role list for everyone.
router.get('/roles', AdminController.getAllRoles);

// Users
// User administration hands out privileges, so it is restricted to Fleet Managers.
router.get('/users', requireRole(['Fleet Manager']), AdminController.getAllUsers);
router.patch('/users/:id/role', requireRole(['Fleet Manager']), AdminController.updateUserRole);

export default router;
