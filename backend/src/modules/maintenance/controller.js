import { MaintenanceService } from './service.js';
import { createMaintenanceSchema } from './validators.js';

export class MaintenanceController {
  static async startMaintenance(req, res, next) {
    try {
      const parsedData = createMaintenanceSchema.parse(req.body);
      const log = await MaintenanceService.startMaintenance(parsedData);
      return res.status(201).json(log);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message });
      }
      return res.status(400).json({ error: error.message });
    }
  }

  static async closeMaintenance(req, res, next) {
    try {
      const { endDate } = req.body;
      const log = await MaintenanceService.closeMaintenance(req.params.id, endDate);
      return res.status(200).json(log);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async getAllLogs(req, res, next) {
    try {
      const filters = { status: req.query.status };
      const logs = await MaintenanceService.getAllLogs(filters);
      return res.status(200).json(logs);
    } catch (error) {
      next(error);
    }
  }
}
