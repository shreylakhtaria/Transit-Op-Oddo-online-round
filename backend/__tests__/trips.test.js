import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  setupTestDb, createTestVehicle, createTestDriver, createTestTrip, Trip, Vehicle, Driver,
} from './setup.js';
import { TripService } from '../src/modules/trips/service.js';

describe('Trips Module', () => {
  let vehicle, driver;

  beforeEach(async () => {
    await setupTestDb();
    vehicle = await createTestVehicle();
    driver = await createTestDriver();
  });

  describe('createTrip', () => {
    test('should create a trip in Draft status', async () => {
      const trip = await TripService.createTrip({
        source: 'Mumbai',
        destination: 'Pune',
        vehicleId: vehicle.id,
        driverId: driver.id,
        cargoWeight: 1000,
        plannedDistance: 200,
      });

      expect(trip).toBeDefined();
      expect(trip.status).toBe('Draft');
      expect(trip.source).toBe('Mumbai');
      expect(trip.destination).toBe('Pune');
    });

    test('should throw if cargo exceeds vehicle capacity', async () => {
      await expect(
        TripService.createTrip({
          source: 'Mumbai',
          destination: 'Pune',
          vehicleId: vehicle.id,
          driverId: driver.id,
          cargoWeight: 99999,
          plannedDistance: 200,
        })
      ).rejects.toThrow('exceeds vehicle');
    });

    test('should throw if vehicle not found', async () => {
      await expect(
        TripService.createTrip({
          source: 'Mumbai',
          destination: 'Pune',
          vehicleId: 99999,
          driverId: driver.id,
          cargoWeight: 1000,
          plannedDistance: 200,
        })
      ).rejects.toThrow('Vehicle not found');
    });

    test('should throw if driver not found', async () => {
      await expect(
        TripService.createTrip({
          source: 'Mumbai',
          destination: 'Pune',
          vehicleId: vehicle.id,
          driverId: 99999,
          cargoWeight: 1000,
          plannedDistance: 200,
        })
      ).rejects.toThrow('Driver not found');
    });

    test('should throw if vehicle status is In Shop', async () => {
      await vehicle.update({ status: 'In Shop' });

      await expect(
        TripService.createTrip({
          source: 'Mumbai',
          destination: 'Pune',
          vehicleId: vehicle.id,
          driverId: driver.id,
          cargoWeight: 1000,
          plannedDistance: 200,
        })
      ).rejects.toThrow('In Shop');
    });

    test('should throw if vehicle is Retired', async () => {
      await vehicle.update({ status: 'Retired' });

      await expect(
        TripService.createTrip({
          source: 'Mumbai',
          destination: 'Pune',
          vehicleId: vehicle.id,
          driverId: driver.id,
          cargoWeight: 1000,
          plannedDistance: 200,
        })
      ).rejects.toThrow('Retired');
    });

    test('should throw if driver is Suspended', async () => {
      await driver.update({ status: 'Suspended' });

      await expect(
        TripService.createTrip({
          source: 'Mumbai',
          destination: 'Pune',
          vehicleId: vehicle.id,
          driverId: driver.id,
          cargoWeight: 1000,
          plannedDistance: 200,
        })
      ).rejects.toThrow('suspended');
    });

    test('should throw if driver license is expired', async () => {
      await driver.update({ licenseExpiryDate: '2020-01-01' });

      await expect(
        TripService.createTrip({
          source: 'Mumbai',
          destination: 'Pune',
          vehicleId: vehicle.id,
          driverId: driver.id,
          cargoWeight: 1000,
          plannedDistance: 200,
        })
      ).rejects.toThrow('expired');
    });

    test('should throw if vehicle already on trip', async () => {
      await vehicle.update({ status: 'On Trip' });

      await expect(
        TripService.createTrip({
          source: 'Mumbai',
          destination: 'Pune',
          vehicleId: vehicle.id,
          driverId: driver.id,
          cargoWeight: 1000,
          plannedDistance: 200,
        })
      ).rejects.toThrow('already on another trip');
    });

    test('should throw if driver off duty', async () => {
      await driver.update({ status: 'Off Duty' });

      await expect(
        TripService.createTrip({
          source: 'Mumbai',
          destination: 'Pune',
          vehicleId: vehicle.id,
          driverId: driver.id,
          cargoWeight: 1000,
          plannedDistance: 200,
        })
      ).rejects.toThrow('off duty');
    });
  });

  describe('dispatchTrip', () => {
    test('should dispatch a Draft trip and update statuses', async () => {
      const trip = await createTestTrip(vehicle.id, driver.id);
      const dispatched = await TripService.dispatchTrip(trip.id);

      expect(dispatched.status).toBe('Dispatched');
      expect(dispatched.dispatchDate).toBeDefined();

      const v = await Vehicle.findByPk(vehicle.id);
      const d = await Driver.findByPk(driver.id);
      expect(v.status).toBe('On Trip');
      expect(d.status).toBe('On Trip');
    });

    test('should throw if trip not found', async () => {
      await expect(TripService.dispatchTrip(99999)).rejects.toThrow('Trip not found');
    });

    test('should throw if trip is not in Draft status', async () => {
      const trip = await createTestTrip(vehicle.id, driver.id, { status: 'Dispatched' });

      await expect(TripService.dispatchTrip(trip.id)).rejects.toThrow('cannot be dispatched');
    });
  });

  describe('completeTrip', () => {
    test('should complete a dispatched trip and restore statuses', async () => {
      const trip = await createTestTrip(vehicle.id, driver.id);
      await TripService.dispatchTrip(trip.id);

      const completed = await TripService.completeTrip(trip.id, {
        actualDistance: 180,
        fuelConsumed: 45,
        revenue: 5000,
      });

      expect(completed.status).toBe('Completed');
      expect(completed.actualDistance).toBe(180);
      expect(completed.fuelConsumed).toBe(45);
      expect(completed.revenue).toBe(5000);
      expect(completed.completionDate).toBeDefined();

      const v = await Vehicle.findByPk(vehicle.id);
      const d = await Driver.findByPk(driver.id);
      expect(v.status).toBe('Available');
      expect(v.odometer).toBe(10000 + 180);
      expect(d.status).toBe('Available');
    });

    test('should create FuelLog and Expense on completion', async () => {
      const trip = await createTestTrip(vehicle.id, driver.id);
      await TripService.dispatchTrip(trip.id);

      await TripService.completeTrip(trip.id, {
        actualDistance: 100,
        fuelConsumed: 30,
        fuelCost: 45,
        revenue: 3000,
      });

      const { FuelLog, Expense } = await import('../src/models/index.js');
      const fuelLogs = await FuelLog.findAll({ where: { tripId: trip.id } });
      expect(fuelLogs.length).toBe(1);
      expect(fuelLogs[0].liters).toBe(30);
      expect(fuelLogs[0].cost).toBe(45);

      const expenses = await Expense.findAll({ where: { tripId: trip.id, category: 'Fuel' } });
      expect(expenses.length).toBe(1);
      expect(expenses[0].amount).toBe(45);
    });

    test('should throw if trip is not Dispatched', async () => {
      const trip = await createTestTrip(vehicle.id, driver.id);

      await expect(
        TripService.completeTrip(trip.id, {
          actualDistance: 100,
          fuelConsumed: 30,
          revenue: 3000,
        })
      ).rejects.toThrow('cannot be completed');
    });

    test('should default fuelCost to consumed * 1.5 if not provided', async () => {
      const trip = await createTestTrip(vehicle.id, driver.id);
      await TripService.dispatchTrip(trip.id);

      await TripService.completeTrip(trip.id, {
        actualDistance: 100,
        fuelConsumed: 40,
        revenue: 3000,
      });

      const { FuelLog } = await import('../src/models/index.js');
      const fuelLog = await FuelLog.findOne({ where: { tripId: trip.id } });
      expect(fuelLog.cost).toBe(40 * 100.0);
    });
  });

  describe('cancelTrip', () => {
    test('should cancel a Draft trip', async () => {
      const trip = await createTestTrip(vehicle.id, driver.id);
      const cancelled = await TripService.cancelTrip(trip.id);
      expect(cancelled.status).toBe('Cancelled');
    });

    test('should cancel a Dispatched trip and restore statuses', async () => {
      const trip = await createTestTrip(vehicle.id, driver.id);
      await TripService.dispatchTrip(trip.id);

      const cancelled = await TripService.cancelTrip(trip.id);
      expect(cancelled.status).toBe('Cancelled');

      const v = await Vehicle.findByPk(vehicle.id);
      const d = await Driver.findByPk(driver.id);
      expect(v.status).toBe('Available');
      expect(d.status).toBe('Available');
    });

    test('should throw if trip is Completed', async () => {
      const trip = await createTestTrip(vehicle.id, driver.id);
      await TripService.dispatchTrip(trip.id);
      await TripService.completeTrip(trip.id, {
        actualDistance: 100,
        fuelConsumed: 30,
        revenue: 3000,
      });

      await expect(TripService.cancelTrip(trip.id)).rejects.toThrow('cannot be cancelled');
    });

    test('should throw if trip is already Cancelled', async () => {
      const trip = await createTestTrip(vehicle.id, driver.id);
      await TripService.cancelTrip(trip.id);

      await expect(TripService.cancelTrip(trip.id)).rejects.toThrow('cannot be cancelled');
    });
  });

  describe('getDispatchableAssets', () => {
    test('should return available vehicles and drivers', async () => {
      const assets = await TripService.getDispatchableAssets();
      expect(assets.vehicles.length).toBe(1);
      expect(assets.drivers.length).toBe(1);
    });

    test('should not include On Trip vehicles', async () => {
      await vehicle.update({ status: 'On Trip' });
      const assets = await TripService.getDispatchableAssets();
      expect(assets.vehicles.length).toBe(0);
    });

    test('should not include drivers with expired licenses', async () => {
      await driver.update({ licenseExpiryDate: '2020-01-01' });
      const assets = await TripService.getDispatchableAssets();
      expect(assets.drivers.length).toBe(0);
    });
  });

  describe('getAllTrips / getTripById', () => {
    test('should list all trips', async () => {
      await createTestTrip(vehicle.id, driver.id);
      const trips = await TripService.getAllTrips();
      expect(trips.length).toBe(1);
    });

    test('should filter trips by status', async () => {
      await createTestTrip(vehicle.id, driver.id, { status: 'Draft' });
      await createTestTrip(vehicle.id, driver.id, { status: 'Cancelled' });

      const drafts = await TripService.getAllTrips({ status: 'Draft' });
      expect(drafts.length).toBe(1);
    });

    test('should get trip by ID with includes', async () => {
      const created = await createTestTrip(vehicle.id, driver.id);
      const found = await TripService.getTripById(created.id);
      expect(found.vehicle).toBeDefined();
      expect(found.driver).toBeDefined();
    });

    test('should throw for non-existent trip', async () => {
      await expect(TripService.getTripById(99999)).rejects.toThrow('Trip not found');
    });
  });
});
