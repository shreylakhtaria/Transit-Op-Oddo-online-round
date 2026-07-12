import { FleetService } from './service.js';
import { vehicleSchema, driverSchema, vehicleDocumentSchema } from './validators.js';
import { parsePagination } from '../../utils/pagination.js';

export class FleetController {
  // --- Vehicles ---

  static async createVehicle(req, res, next) {
    try {
      const parsedData = vehicleSchema.parse(req.body);
      const vehicle = await FleetService.createVehicle(parsedData);
      return res.status(201).json(vehicle);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message });
      }
      return res.status(400).json({ error: error.message });
    }
  }

  static async getAllVehicles(req, res, next) {
    try {
      const filters = {
        type: req.query.type,
        status: req.query.status
      };
      const pagination = parsePagination(req.query);
      const vehicles = await FleetService.getAllVehicles(filters, pagination);
      return res.status(200).json(vehicles);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message });
      }
      next(error);
    }
  }

  static async getVehicleById(req, res, next) {
    try {
      const vehicle = await FleetService.getVehicleById(req.params.id);
      return res.status(200).json(vehicle);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  }

  static async updateVehicle(req, res, next) {
    try {
      // Allow partial updates on update request
      const parsedData = vehicleSchema.partial().parse(req.body);
      const vehicle = await FleetService.updateVehicle(req.params.id, parsedData);
      return res.status(200).json(vehicle);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message });
      }
      return res.status(400).json({ error: error.message });
    }
  }

  static async deleteVehicle(req, res, next) {
    try {
      const result = await FleetService.deleteVehicle(req.params.id);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  }

  // --- Drivers ---

  static async createDriver(req, res, next) {
    try {
      const parsedData = driverSchema.parse(req.body);
      const driver = await FleetService.createDriver(parsedData);
      return res.status(201).json(driver);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message });
      }
      return res.status(400).json({ error: error.message });
    }
  }

  static async getAllDrivers(req, res, next) {
    try {
      const filters = {
        status: req.query.status
      };
      const pagination = parsePagination(req.query);
      const drivers = await FleetService.getAllDrivers(filters, pagination);
      return res.status(200).json(drivers);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message });
      }
      next(error);
    }
  }

  static async getDriverById(req, res, next) {
    try {
      const driver = await FleetService.getDriverById(req.params.id);
      return res.status(200).json(driver);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  }

  static async updateDriver(req, res, next) {
    try {
      const parsedData = driverSchema.partial().parse(req.body);
      const driver = await FleetService.updateDriver(req.params.id, parsedData);
      return res.status(200).json(driver);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message });
      }
      return res.status(400).json({ error: error.message });
    }
  }

  static async deleteDriver(req, res, next) {
    try {
      const result = await FleetService.deleteDriver(req.params.id);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  }

  static async sendLicenseExpiryReminders(req, res, next) {
    try {
      const result = await FleetService.sendLicenseExpiryReminders();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // --- Vehicle Document Management ---

  static async addVehicleDocument(req, res, next) {
    try {
      const parsedData = vehicleDocumentSchema.parse(req.body);
      const document = await FleetService.addVehicleDocument(req.params.id, parsedData);
      return res.status(201).json(document);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message });
      }
      return res.status(400).json({ error: error.message });
    }
  }

  static async getVehicleDocuments(req, res, next) {
    try {
      const documents = await FleetService.getVehicleDocuments(req.params.id);
      return res.status(200).json(documents);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  }

  static async deleteVehicleDocument(req, res, next) {
    try {
      const result = await FleetService.deleteVehicleDocument(req.params.docId);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  }
}
