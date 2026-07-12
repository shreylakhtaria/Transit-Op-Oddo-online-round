import { AnalyticsService } from './service.js';

export class AnalyticsController {
  static async getDashboardStats(req, res, next) {
    try {
      const filters = {
        type: req.query.type,
        status: req.query.status
      };
      const stats = await AnalyticsService.getDashboardStats(filters);
      return res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }

  static async exportCSV(req, res, next) {
    try {
      const csvData = await AnalyticsService.generateCSVExport();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=fleet_analytics_report.csv');
      return res.status(200).send(csvData);
    } catch (error) {
      next(error);
    }
  }

  static async getMonthlyRevenue(req, res, next) {
    try {
      const data = await AnalyticsService.getMonthlyRevenue();
      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  static async getTopCostliestVehicles(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 5;
      const data = await AnalyticsService.getTopCostliestVehicles(limit);
      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }
}
