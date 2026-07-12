import { AdminService } from './service.js';
import { updateUserRoleSchema } from './validators.js';

export class AdminController {
  static async getAllRoles(req, res, next) {
    try {
      const roles = await AdminService.getAllRoles();
      return res.status(200).json(roles);
    } catch (error) {
      next(error);
    }
  }

  static async getAllUsers(req, res, next) {
    try {
      const users = await AdminService.getAllUsers();
      return res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  }

  static async updateUserRole(req, res, next) {
    try {
      const parsedData = updateUserRoleSchema.parse(req.body);
      const user = await AdminService.updateUserRole(req.params.id, parsedData);
      return res.status(200).json(user);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message });
      }
      if (error.status === 404) {
        return res.status(404).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }
  }
}
