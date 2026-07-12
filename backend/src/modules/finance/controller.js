import { FinanceService } from './service.js';
import { fuelLogSchema, expenseSchema } from './validators.js';

export class FinanceController {
  static async logFuel(req, res, next) {
    try {
      const parsedData = fuelLogSchema.parse(req.body);
      const log = await FinanceService.logFuel(parsedData);
      return res.status(201).json(log);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message });
      }
      return res.status(400).json({ error: error.message });
    }
  }

  static async logExpense(req, res, next) {
    try {
      const parsedData = expenseSchema.parse(req.body);
      const expense = await FinanceService.logExpense(parsedData);
      return res.status(201).json(expense);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message });
      }
      return res.status(400).json({ error: error.message });
    }
  }

  static async getVehicleOperationalCost(req, res, next) {
    try {
      const result = await FinanceService.getVehicleOperationalCost(req.params.vehicleId);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  }

  static async getAllExpenses(req, res, next) {
    try {
      const filters = {
        vehicleId: req.query.vehicleId ? parseInt(req.query.vehicleId, 10) : undefined,
        category: req.query.category
      };
      const expenses = await FinanceService.getAllExpenses(filters);
      return res.status(200).json(expenses);
    } catch (error) {
      next(error);
    }
  }
}
