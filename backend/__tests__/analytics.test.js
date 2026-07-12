import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  setupTestDb, createTestVehicle, createTestDriver, createTestTrip,
  Vehicle, Driver, Trip, Expense, FuelLog,
} from './setup.js';
import { AnalyticsService } from '../src/modules/analytics/service.js';

describe('Analytics Module', () => {
  beforeEach(async () => {
    await setupTestDb();
  });

  describe('getDashboardStats', () => {
    test('should return KPIs, chartData, and recentTrips', async () => {
      const vehicle = await createTestVehicle();
      const driver = await createTestDriver();

      const stats = await AnalyticsService.getDashboardStats();

      expect(stats.kpis).toBeDefined();
      expect(stats.chartData).toBeDefined();
      expect(stats.recentTrips).toBeDefined();

      expect(stats.kpis.activeVehicles).toBe(0);
      expect(stats.kpis.availableVehicles).toBe(1);
      expect(stats.kpis.vehiclesInMaintenance).toBe(0);
      expect(stats.kpis.fleetUtilization).toBe(0);
    });

    test('should count active vehicles correctly', async () => {
      await createTestVehicle({ status: 'On Trip' });
      await createTestVehicle({ status: 'Available' });
      await createTestVehicle({ status: 'In Shop' });

      const stats = await AnalyticsService.getDashboardStats();
      expect(stats.kpis.activeVehicles).toBe(1);
      expect(stats.kpis.availableVehicles).toBe(1);
      expect(stats.kpis.vehiclesInMaintenance).toBe(1);
    });

    test('should compute per-vehicle chart data', async () => {
      const vehicle = await createTestVehicle({ acquisitionCost: 50000 });

      await Expense.create({
        vehicleId: vehicle.id,
        description: 'Fuel',
        amount: 200,
        category: 'Fuel',
        date: '2026-07-12',
      });

      await Expense.create({
        vehicleId: vehicle.id,
        description: 'Maintenance',
        amount: 500,
        category: 'Maintenance',
        date: '2026-07-12',
      });

      const stats = await AnalyticsService.getDashboardStats();
      expect(stats.chartData.length).toBe(1);
      expect(stats.chartData[0].fuelCost).toBe(200);
      expect(stats.chartData[0].maintenanceCost).toBe(500);
      expect(stats.chartData[0].totalOperationalCost).toBe(700);
    });

    test('should apply vehicle type filter', async () => {
      await createTestVehicle({ type: 'Truck' });
      await createTestVehicle({ type: 'Van' });

      const stats = await AnalyticsService.getDashboardStats({ type: 'Truck' });
      expect(stats.chartData.length).toBe(1);
      expect(stats.chartData[0].type).toBe('Truck');
    });

    test('should count active and pending trips', async () => {
      const vehicle = await createTestVehicle();
      const driver = await createTestDriver();
      await createTestTrip(vehicle.id, driver.id, { status: 'Dispatched' });
      await createTestTrip(vehicle.id, driver.id, { status: 'Draft' });

      const stats = await AnalyticsService.getDashboardStats();
      expect(stats.kpis.activeTrips).toBe(1);
      expect(stats.kpis.pendingTrips).toBe(1);
    });
  });

  describe('getMonthlyRevenue', () => {
    test('should aggregate revenue by month', async () => {
      const vehicle = await createTestVehicle();
      const driver = await createTestDriver();

      const trip1 = await createTestTrip(vehicle.id, driver.id, { status: 'Completed', revenue: 3000 });
      await trip1.update({ completionDate: new Date('2026-07-01') });

      const trip2 = await createTestTrip(vehicle.id, driver.id, { status: 'Completed', revenue: 5000 });
      await trip2.update({ completionDate: new Date('2026-07-15') });

      const result = await AnalyticsService.getMonthlyRevenue();
      expect(result.length).toBe(1);
      expect(result[0].month).toBe('2026-07');
      expect(result[0].revenue).toBe(8000);
    });

    test('should return empty array when no completed trips', async () => {
      const result = await AnalyticsService.getMonthlyRevenue();
      expect(result.length).toBe(0);
    });
  });

  describe('getTopCostliestVehicles', () => {
    test('should return vehicles sorted by operational cost', async () => {
      const v1 = await createTestVehicle({ registrationNumber: 'MH-01-V1' });
      const v2 = await createTestVehicle({ registrationNumber: 'MH-02-V2' });

      await Expense.create({
        vehicleId: v1.id, description: 'Fuel', amount: 100, category: 'Fuel', date: '2026-07-10',
      });
      await Expense.create({
        vehicleId: v2.id, description: 'Fuel', amount: 500, category: 'Fuel', date: '2026-07-10',
      });

      const result = await AnalyticsService.getTopCostliestVehicles(5);
      expect(result.length).toBe(2);
      expect(result[0].totalOperationalCost).toBeGreaterThanOrEqual(result[1].totalOperationalCost);
    });

    test('should respect limit parameter', async () => {
      await createTestVehicle();
      await createTestVehicle();
      await createTestVehicle();

      const result = await AnalyticsService.getTopCostliestVehicles(2);
      expect(result.length).toBe(2);
    });
  });

  describe('generateCSVExport', () => {
    test('should return CSV string with header row', async () => {
      await createTestVehicle();
      const csv = await AnalyticsService.generateCSVExport();
      const lines = csv.split('\n');
      expect(lines[0]).toContain('Registration Number');
      expect(lines[0]).toContain('Model');
      expect(lines[0]).toContain('Revenue');
    });
  });
});
