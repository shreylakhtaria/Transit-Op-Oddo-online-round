import { TripService } from './service.js';
import { createTripSchema, completeTripSchema } from './validators.js';

export class TripController {
  static async createTrip(req, res, next) {
    try {
      const parsedData = createTripSchema.parse(req.body);
      const trip = await TripService.createTrip(parsedData);
      return res.status(201).json(trip);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message });
      }
      return res.status(400).json({ error: error.message });
    }
  }

  static async getAllTrips(req, res, next) {
    try {
      const filters = { status: req.query.status };
      const trips = await TripService.getAllTrips(filters);
      return res.status(200).json(trips);
    } catch (error) {
      next(error);
    }
  }

  static async getTripById(req, res, next) {
    try {
      const trip = await TripService.getTripById(req.params.id);
      return res.status(200).json(trip);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  }

  static async dispatchTrip(req, res, next) {
    try {
      const trip = await TripService.dispatchTrip(req.params.id);
      return res.status(200).json(trip);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async completeTrip(req, res, next) {
    try {
      const parsedData = completeTripSchema.parse(req.body);
      const trip = await TripService.completeTrip(req.params.id, parsedData);
      return res.status(200).json(trip);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message });
      }
      return res.status(400).json({ error: error.message });
    }
  }

  static async cancelTrip(req, res, next) {
    try {
      const trip = await TripService.cancelTrip(req.params.id);
      return res.status(200).json(trip);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async getDispatchableAssets(req, res, next) {
    try {
      const assets = await TripService.getDispatchableAssets();
      return res.status(200).json(assets);
    } catch (error) {
      next(error);
    }
  }
}
