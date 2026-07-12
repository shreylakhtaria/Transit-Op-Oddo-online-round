import { describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import {
  setupTestDb, createTestApp, authAs, createTestVehicle, createTestDriver, createTestTrip,
  Vehicle, Expense, FuelLog, Trip,
} from './setup.js';
import { FinanceService } from '../src/modules/finance/service.js';

describe('Finance Module', () => {
  beforeEach(async () => {
    await setupTestDb();
  });

  describe('logFuel', () => {
    test('should create FuelLog and duplicate as Expense', async () => {
      const vehicle = await createTestVehicle();

      const fuelLog = await FinanceService.logFuel({
        vehicleId: vehicle.id,
        liters: 50,
        cost: 75,
        date: '2026-07-12',
      });

      expect(fuelLog).toBeDefined();
      expect(fuelLog.liters).toBe(50);
      expect(fuelLog.cost).toBe(75);

      const expenses = await Expense.findAll({
        where: { vehicleId: vehicle.id, category: 'Fuel' },
      });
      expect(expenses.length).toBe(1);
      expect(expenses[0].amount).toBe(75);
    });

    test('should link fuel log to trip if tripId provided', async () => {
      const vehicle = await createTestVehicle();
      const driver = await createTestDriver();
      const trip = await createTestTrip(vehicle.id, driver.id, { status: 'Dispatched' });

      const fuelLog = await FinanceService.logFuel({
        vehicleId: vehicle.id,
        tripId: trip.id,
        liters: 30,
        cost: 45,
        date: '2026-07-12',
      });

      expect(fuelLog.tripId).toBe(trip.id);
    });

    test('should throw if vehicle not found', async () => {
      await expect(
        FinanceService.logFuel({
          vehicleId: 99999,
          liters: 50,
          cost: 75,
          date: '2026-07-12',
        })
      ).rejects.toThrow('Vehicle not found');
    });

    test('should throw if referenced trip not found', async () => {
      const vehicle = await createTestVehicle();

      await expect(
        FinanceService.logFuel({
          vehicleId: vehicle.id,
          tripId: 99999,
          liters: 50,
          cost: 75,
          date: '2026-07-12',
        })
      ).rejects.toThrow('Trip not found');
    });
  });

  describe('logExpense', () => {
    test('should create an expense entry', async () => {
      const vehicle = await createTestVehicle();

      const expense = await FinanceService.logExpense({
        vehicleId: vehicle.id,
        description: 'Highway toll',
        amount: 200,
        category: 'Toll',
        date: '2026-07-12',
      });

      expect(expense).toBeDefined();
      expect(expense.category).toBe('Toll');
      expect(expense.amount).toBe(200);
    });

    test('should throw if vehicle not found', async () => {
      await expect(
        FinanceService.logExpense({
          vehicleId: 99999,
          description: 'Something',
          amount: 100,
          category: 'Other',
          date: '2026-07-12',
        })
      ).rejects.toThrow('Vehicle not found');
    });
  });

  describe('getVehicleOperationalCost', () => {
    test('should aggregate costs by category', async () => {
      const vehicle = await createTestVehicle();

      await FinanceService.logFuel({
        vehicleId: vehicle.id,
        liters: 50,
        cost: 75,
        date: '2026-07-10',
      });

      await FinanceService.logExpense({
        vehicleId: vehicle.id,
        description: 'Oil change',
        amount: 150,
        category: 'Maintenance',
        date: '2026-07-11',
      });

      await FinanceService.logExpense({
        vehicleId: vehicle.id,
        description: 'Highway toll',
        amount: 50,
        category: 'Toll',
        date: '2026-07-12',
      });

      const result = await FinanceService.getVehicleOperationalCost(vehicle.id);

      expect(result.fuelCost).toBe(75);
      expect(result.maintenanceCost).toBe(150);
      expect(result.tollCost).toBe(50);
      expect(result.totalOperationalCost).toBe(225); // fuel + maintenance
      expect(result.totalExpenses).toBe(275); // fuel + maintenance + toll
    });

    test('should throw if vehicle not found', async () => {
      await expect(FinanceService.getVehicleOperationalCost(99999)).rejects.toThrow('Vehicle not found');
    });
  });

  describe('getAllExpenses', () => {
    test('should list all expenses', async () => {
      const vehicle = await createTestVehicle();
      await FinanceService.logExpense({
        vehicleId: vehicle.id,
        description: 'Toll',
        amount: 50,
        category: 'Toll',
        date: '2026-07-12',
      });

      const expenses = await FinanceService.getAllExpenses();
      expect(expenses.length).toBe(1);
    });

    test('should filter by category', async () => {
      const vehicle = await createTestVehicle();
      await FinanceService.logExpense({
        vehicleId: vehicle.id,
        description: 'Toll',
        amount: 50,
        category: 'Toll',
        date: '2026-07-12',
      });
      await FinanceService.logExpense({
        vehicleId: vehicle.id,
        description: 'Other cost',
        amount: 30,
        category: 'Other',
        date: '2026-07-12',
      });

      const tolls = await FinanceService.getAllExpenses({ category: 'Toll' });
      expect(tolls.length).toBe(1);
      expect(tolls[0].category).toBe('Toll');
    });

    test('should filter by vehicleId', async () => {
      const v1 = await createTestVehicle();
      const v2 = await createTestVehicle();

      await FinanceService.logExpense({
        vehicleId: v1.id, description: 'A', amount: 10, category: 'Other', date: '2026-07-12',
      });
      await FinanceService.logExpense({
        vehicleId: v2.id, description: 'B', amount: 20, category: 'Other', date: '2026-07-12',
      });

      const v1Expenses = await FinanceService.getAllExpenses({ vehicleId: v1.id });
      expect(v1Expenses.length).toBe(1);
    });
  });
  describe('getFuelLogs', () => {
    test('should return fuel logs newest first with the vehicle attached', async () => {
      const vehicle = await createTestVehicle({ registrationNumber: 'MH-FUEL-1' });
      const driver = await createTestDriver({ licenseNumber: 'DL-FUEL-1' });
      const trip = await createTestTrip(vehicle.id, driver.id, { status: 'Dispatched' });

      await FinanceService.logFuel({
        vehicleId: vehicle.id, liters: 10, cost: 15, date: '2026-07-10',
      });
      await FinanceService.logFuel({
        vehicleId: vehicle.id, tripId: trip.id, liters: 20, cost: 30, date: '2026-07-12',
      });

      const logs = await FinanceService.getFuelLogs();

      expect(logs.length).toBe(2);
      // Newest first: 2026-07-12 before 2026-07-10.
      expect(logs[0].date).toBe('2026-07-12');
      expect(logs[1].date).toBe('2026-07-10');

      const [newest] = logs;
      expect(newest.tripId).toBe(trip.id);
      expect(newest.liters).toBe(20);
      expect(newest.cost).toBe(30);
      expect(newest.vehicle.id).toBe(vehicle.id);
      expect(newest.vehicle.registrationNumber).toBe('MH-FUEL-1');
      expect(newest.vehicle.model).toBe('Tata Ace');
    });

    test('should filter by vehicleId', async () => {
      const v1 = await createTestVehicle({ registrationNumber: 'MH-FUEL-A' });
      const v2 = await createTestVehicle({ registrationNumber: 'MH-FUEL-B' });

      await FinanceService.logFuel({ vehicleId: v1.id, liters: 10, cost: 15, date: '2026-07-12' });
      await FinanceService.logFuel({ vehicleId: v2.id, liters: 20, cost: 30, date: '2026-07-12' });

      const logs = await FinanceService.getFuelLogs({ vehicleId: v1.id });

      expect(logs.length).toBe(1);
      expect(logs[0].vehicleId).toBe(v1.id);
    });

    test('should return an empty array when there are no fuel logs', async () => {
      const logs = await FinanceService.getFuelLogs();

      expect(logs).toEqual([]);
    });
  });

  describe('GET /api/expenses/fuel', () => {
    let app;

    beforeEach(() => {
      app = createTestApp();
    });

    test('should return 401 for an anonymous request', async () => {
      const res = await request(app).get('/api/expenses/fuel');

      expect(res.status).toBe(401);
    });

    test('should be readable by any authenticated role', async () => {
      const { token } = await authAs('Driver');
      const vehicle = await createTestVehicle({ registrationNumber: 'MH-FUEL-GET' });
      await FinanceService.logFuel({
        vehicleId: vehicle.id, liters: 42, cost: 63, date: '2026-07-12',
      });

      const res = await request(app)
        .get('/api/expenses/fuel')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(Object.keys(res.body[0]).sort()).toEqual(
        ['cost', 'date', 'id', 'liters', 'tripId', 'vehicle', 'vehicleId']
      );
      expect(res.body[0]).toMatchObject({
        vehicleId: vehicle.id,
        tripId: null,
        liters: 42,
        cost: 63,
        date: '2026-07-12',
        vehicle: {
          id: vehicle.id,
          registrationNumber: 'MH-FUEL-GET',
          model: 'Tata Ace',
        },
      });
    });

    test('should filter by vehicleId', async () => {
      const { token } = await authAs('Financial Analyst');
      const v1 = await createTestVehicle({ registrationNumber: 'MH-FUEL-X' });
      const v2 = await createTestVehicle({ registrationNumber: 'MH-FUEL-Y' });

      await FinanceService.logFuel({ vehicleId: v1.id, liters: 10, cost: 15, date: '2026-07-12' });
      await FinanceService.logFuel({ vehicleId: v2.id, liters: 20, cost: 30, date: '2026-07-12' });

      const res = await request(app)
        .get('/api/expenses/fuel')
        .query({ vehicleId: v2.id })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].vehicleId).toBe(v2.id);
    });

    test('should not shadow the existing POST /api/expenses/fuel route', async () => {
      const { token } = await authAs('Fleet Manager');
      const vehicle = await createTestVehicle({ registrationNumber: 'MH-FUEL-POST' });

      const created = await request(app)
        .post('/api/expenses/fuel')
        .set('Authorization', `Bearer ${token}`)
        .send({ vehicleId: vehicle.id, liters: 5, cost: 8, date: '2026-07-12' });

      expect(created.status).toBe(201);

      const listed = await request(app)
        .get('/api/expenses/fuel')
        .set('Authorization', `Bearer ${token}`);

      expect(listed.status).toBe(200);
      expect(listed.body.length).toBe(1);
      expect(listed.body[0].liters).toBe(5);
    });
  });
});
