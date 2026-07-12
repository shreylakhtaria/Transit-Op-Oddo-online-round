import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  setupTestDb, createTestVehicle, MaintenanceLog, Expense, Vehicle,
} from './setup.js';
import { MaintenanceService } from '../src/modules/maintenance/service.js';

describe('Maintenance Module', () => {
  beforeEach(async () => {
    await setupTestDb();
  });

  describe('startMaintenance', () => {
    test('should create maintenance log and set vehicle to In Shop', async () => {
      const vehicle = await createTestVehicle();

      const log = await MaintenanceService.startMaintenance({
        vehicleId: vehicle.id,
        description: 'Engine overhaul',
        cost: 2500,
        startDate: '2026-07-15',
      });

      expect(log).toBeDefined();
      expect(log.description).toBe('Engine overhaul');
      expect(log.cost).toBe(2500);
      expect(log.status).toBe('Active');

      const v = await Vehicle.findByPk(vehicle.id);
      expect(v.status).toBe('In Shop');
    });

    test('should auto-create a Maintenance expense', async () => {
      const vehicle = await createTestVehicle();

      await MaintenanceService.startMaintenance({
        vehicleId: vehicle.id,
        description: 'Brake replacement',
        cost: 800,
        startDate: '2026-07-15',
      });

      const expenses = await Expense.findAll({
        where: { vehicleId: vehicle.id, category: 'Maintenance' },
      });
      expect(expenses.length).toBe(1);
      expect(expenses[0].amount).toBe(800);
    });

    test('should throw if vehicle not found', async () => {
      await expect(
        MaintenanceService.startMaintenance({
          vehicleId: 99999,
          description: 'Something',
          cost: 100,
          startDate: '2026-07-15',
        })
      ).rejects.toThrow('Vehicle not found');
    });

    test('should throw if vehicle is On Trip', async () => {
      const vehicle = await createTestVehicle({ status: 'On Trip' });

      await expect(
        MaintenanceService.startMaintenance({
          vehicleId: vehicle.id,
          description: 'Oil change',
          cost: 50,
          startDate: '2026-07-15',
        })
      ).rejects.toThrow('on a trip');
    });
  });

  describe('closeMaintenance', () => {
    test('should close maintenance and restore vehicle to Available', async () => {
      const vehicle = await createTestVehicle();
      const log = await MaintenanceService.startMaintenance({
        vehicleId: vehicle.id,
        description: 'Engine overhaul',
        cost: 2500,
        startDate: '2026-07-15',
      });

      const closed = await MaintenanceService.closeMaintenance(log.id, '2026-07-20');
      expect(closed.status).toBe('Closed');
      expect(closed.endDate).toBe('2026-07-20');

      const v = await Vehicle.findByPk(vehicle.id);
      expect(v.status).toBe('Available');
    });

    test('should use today as default end date if not provided', async () => {
      const vehicle = await createTestVehicle();
      const log = await MaintenanceService.startMaintenance({
        vehicleId: vehicle.id,
        description: 'Quick fix',
        cost: 100,
        startDate: '2026-07-15',
      });

      const closed = await MaintenanceService.closeMaintenance(log.id);
      expect(closed.endDate).toBeDefined();
      expect(closed.status).toBe('Closed');
    });

    test('should throw if maintenance record not found', async () => {
      await expect(MaintenanceService.closeMaintenance(99999)).rejects.toThrow('not found');
    });

    test('should throw if maintenance record is already closed', async () => {
      const vehicle = await createTestVehicle();
      const log = await MaintenanceService.startMaintenance({
        vehicleId: vehicle.id,
        description: 'Engine overhaul',
        cost: 2500,
        startDate: '2026-07-15',
      });

      await MaintenanceService.closeMaintenance(log.id);
      await expect(MaintenanceService.closeMaintenance(log.id)).rejects.toThrow('already closed');
    });
  });

  describe('getAllLogs', () => {
    test('should list all maintenance logs', async () => {
      const vehicle = await createTestVehicle();
      await MaintenanceService.startMaintenance({
        vehicleId: vehicle.id,
        description: 'Oil change',
        cost: 50,
        startDate: '2026-07-15',
      });

      const logs = await MaintenanceService.getAllLogs();
      expect(logs.length).toBe(1);
    });

    test('should filter logs by status', async () => {
      const vehicle = await createTestVehicle();
      const log = await MaintenanceService.startMaintenance({
        vehicleId: vehicle.id,
        description: 'Engine work',
        cost: 500,
        startDate: '2026-07-15',
      });
      await MaintenanceService.closeMaintenance(log.id);

      const active = await MaintenanceService.getAllLogs({ status: 'Active' });
      expect(active.length).toBe(0);

      const closed = await MaintenanceService.getAllLogs({ status: 'Closed' });
      expect(closed.length).toBe(1);
    });
  });
});
