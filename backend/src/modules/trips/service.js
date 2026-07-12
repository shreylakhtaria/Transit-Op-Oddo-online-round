import { Trip, Vehicle, Driver, FuelLog, Expense, sequelize } from '../../models/index.js';
import { Op } from 'sequelize';
import { paginate } from '../../utils/pagination.js';

export class TripService {
  static async createTrip(data) {
    const vehicle = await Vehicle.findByPk(data.vehicleId);
    if (!vehicle) throw new Error('Vehicle not found');

    const driver = await Driver.findByPk(data.driverId);
    if (!driver) throw new Error('Driver not found');

    // Business Rule: Cargo Weight must not exceed the vehicle's maximum load capacity.
    if (data.cargoWeight > vehicle.maxLoadCapacity) {
      throw new Error(`Cargo weight (${data.cargoWeight} kg) exceeds vehicle's maximum load capacity (${vehicle.maxLoadCapacity} kg)`);
    }

    // Business Rule: Retired or In Shop vehicles must never appear in the dispatch selection.
    if (vehicle.status === 'Retired' || vehicle.status === 'In Shop') {
      throw new Error(`Vehicle is currently ${vehicle.status} and cannot be assigned to a trip`);
    }

    // Business Rule: Drivers with expired licenses or Suspended status cannot be assigned to trips.
    if (driver.status === 'Suspended') {
      throw new Error('Driver is suspended and cannot be assigned to a trip');
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (driver.licenseExpiryDate < todayStr) {
      throw new Error(`Driver's license is expired (Expiry: ${driver.licenseExpiryDate})`);
    }

    // Business Rule: A driver or vehicle already marked On Trip cannot be assigned to another trip.
    if (vehicle.status === 'On Trip') {
      throw new Error('Vehicle is already on another trip');
    }
    if (driver.status === 'On Trip') {
      throw new Error('Driver is already on another trip');
    }

    // If driver is Off Duty, we can warn, but let's block them as well to be safe, or just check they are not Suspended/Expired/On Trip. Let's block Off Duty too if they must be Available to start a trip.
    if (driver.status === 'Off Duty') {
      throw new Error('Driver is off duty');
    }

    return await Trip.create({
      ...data,
      status: 'Draft'
    });
  }

  static async dispatchTrip(id) {
    const transaction = await sequelize.transaction();
    try {
      const trip = await Trip.findByPk(id, { transaction });
      if (!trip) throw new Error('Trip not found');

      if (trip.status !== 'Draft') {
        throw new Error(`Trip cannot be dispatched from status: ${trip.status}`);
      }

      const vehicle = await Vehicle.findByPk(trip.vehicleId, { transaction });
      const driver = await Driver.findByPk(trip.driverId, { transaction });

      if (vehicle.status === 'On Trip') throw new Error('Vehicle is already on a trip');
      if (driver.status === 'On Trip') throw new Error('Driver is already on a trip');

      // Dispatching a trip automatically changes both the vehicle and driver status to On Trip.
      await vehicle.update({ status: 'On Trip' }, { transaction });
      await driver.update({ status: 'On Trip' }, { transaction });

      await trip.update({
        status: 'Dispatched',
        dispatchDate: new Date()
      }, { transaction });

      await transaction.commit();
      return trip;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async completeTrip(id, { actualDistance, fuelConsumed, fuelCost, revenue }) {
    const transaction = await sequelize.transaction();
    try {
      const trip = await Trip.findByPk(id, { transaction });
      if (!trip) throw new Error('Trip not found');

      if (trip.status !== 'Dispatched') {
        throw new Error(`Trip cannot be completed from status: ${trip.status}`);
      }

      const vehicle = await Vehicle.findByPk(trip.vehicleId, { transaction });
      const driver = await Driver.findByPk(trip.driverId, { transaction });

      // Completing a trip automatically changes both the vehicle and driver status back to Available.
      await vehicle.update({
        status: 'Available',
        // Update odometer: final odometer is current + actual trip distance
        odometer: vehicle.odometer + actualDistance
      }, { transaction });

      await driver.update({ status: 'Available' }, { transaction });

      await trip.update({
        status: 'Completed',
        actualDistance,
        fuelConsumed,
        revenue,
        completionDate: new Date()
      }, { transaction });

      // Automatically log fuel consumed
      const calculatedFuelCost = fuelCost || fuelConsumed * 1.5; // Default $1.5/L if not provided
      const today = new Date().toISOString().split('T')[0];

      await FuelLog.create({
        vehicleId: vehicle.id,
        tripId: trip.id,
        liters: fuelConsumed,
        cost: calculatedFuelCost,
        date: today
      }, { transaction });

      // Also create an Expense entry for Fuel cost
      await Expense.create({
        vehicleId: vehicle.id,
        tripId: trip.id,
        description: `Fuel for Trip #${trip.id}`,
        amount: calculatedFuelCost,
        category: 'Fuel',
        date: today
      }, { transaction });

      await transaction.commit();
      return trip;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async cancelTrip(id) {
    const transaction = await sequelize.transaction();
    try {
      const trip = await Trip.findByPk(id, { transaction });
      if (!trip) throw new Error('Trip not found');

      if (trip.status === 'Completed' || trip.status === 'Cancelled') {
        throw new Error(`Trip cannot be cancelled in status: ${trip.status}`);
      }

      const vehicle = await Vehicle.findByPk(trip.vehicleId, { transaction });
      const driver = await Driver.findByPk(trip.driverId, { transaction });

      // Cancelling a dispatched trip restores the vehicle and driver to Available.
      if (trip.status === 'Dispatched') {
        await vehicle.update({ status: 'Available' }, { transaction });
        await driver.update({ status: 'Available' }, { transaction });
      }

      await trip.update({ status: 'Cancelled' }, { transaction });

      await transaction.commit();
      return trip;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async getAllTrips(filters = {}, pagination = null) {
    const where = {};
    if (filters.status) where.status = filters.status;
    return await paginate(Trip, {
      where,
      include: [
        { model: Vehicle, as: 'vehicle', attributes: ['registrationNumber', 'model', 'type'] },
        { model: Driver, as: 'driver', attributes: ['name', 'licenseNumber'] }
      ],
      order: [['createdAt', 'DESC']]
    }, pagination);
  }

  static async getTripById(id) {
    const trip = await Trip.findByPk(id, {
      include: [
        { model: Vehicle, as: 'vehicle' },
        { model: Driver, as: 'driver' }
      ]
    });
    if (!trip) throw new Error('Trip not found');
    return trip;
  }

  static async getDispatchableAssets() {
    const todayStr = new Date().toISOString().split('T')[0];

    // Vehicles: Available status only
    const vehicles = await Vehicle.findAll({
      where: { status: 'Available' }
    });

    // Drivers: Available, not suspended, and license not expired
    const drivers = await Driver.findAll({
      where: {
        status: 'Available',
        licenseExpiryDate: {
          [Op.gte]: todayStr
        }
      }
    });

    return { vehicles, drivers };
  }
}
