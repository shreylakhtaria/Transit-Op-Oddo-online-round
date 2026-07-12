import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  setupTestDb, createTestVehicle, createTestDriver, Vehicle, VehicleDocument, User, Role,
} from './setup.js';
import { FleetService } from '../src/modules/fleet/service.js';

describe('Fleet Module', () => {
  beforeEach(async () => {
    await setupTestDb();
  });

  describe('Vehicle CRUD', () => {
    test('should create a vehicle successfully', async () => {
      const vehicle = await FleetService.createVehicle({
        registrationNumber: 'MH-01-AB-1234',
        model: 'Tata Ace',
        type: 'Truck',
        maxLoadCapacity: 5000,
        odometer: 10000,
        acquisitionCost: 50000,
      });

      expect(vehicle).toBeDefined();
      expect(vehicle.registrationNumber).toBe('MH-01-AB-1234');
      expect(vehicle.model).toBe('Tata Ace');
      expect(vehicle.status).toBe('Available');
    });

    test('should throw on duplicate registration number', async () => {
      await FleetService.createVehicle({
        registrationNumber: 'MH-01-AB-1234',
        model: 'Tata Ace',
        type: 'Truck',
        maxLoadCapacity: 5000,
        odometer: 10000,
        acquisitionCost: 50000,
      });

      await expect(
        FleetService.createVehicle({
          registrationNumber: 'MH-01-AB-1234',
          model: 'Eeco',
          type: 'Van',
          maxLoadCapacity: 800,
          odometer: 5000,
          acquisitionCost: 8000,
        })
      ).rejects.toThrow('already exists');
    });

    test('should get all vehicles', async () => {
      await createTestVehicle({ registrationNumber: 'MH-01-V1' });
      await createTestVehicle({ registrationNumber: 'MH-01-V2' });

      const vehicles = await FleetService.getAllVehicles();
      expect(vehicles.length).toBe(2);
    });

    test('should filter vehicles by status', async () => {
      await createTestVehicle({ registrationNumber: 'MH-01-V1', status: 'Available' });
      await createTestVehicle({ registrationNumber: 'MH-01-V2', status: 'In Shop' });

      const available = await FleetService.getAllVehicles({ status: 'Available' });
      expect(available.length).toBe(1);
      expect(available[0].status).toBe('Available');
    });

    test('should filter vehicles by type', async () => {
      await createTestVehicle({ registrationNumber: 'MH-01-V1', type: 'Truck' });
      await createTestVehicle({ registrationNumber: 'MH-01-V2', type: 'Van' });

      const trucks = await FleetService.getAllVehicles({ type: 'Truck' });
      expect(trucks.length).toBe(1);
      expect(trucks[0].type).toBe('Truck');
    });

    test('should get vehicle by ID', async () => {
      const created = await createTestVehicle();
      const found = await FleetService.getVehicleById(created.id);
      expect(found.id).toBe(created.id);
    });

    test('should throw when vehicle not found', async () => {
      await expect(FleetService.getVehicleById(99999)).rejects.toThrow('Vehicle not found');
    });

    test('should update a vehicle', async () => {
      const created = await createTestVehicle();
      const updated = await FleetService.updateVehicle(created.id, {
        model: 'Updated Model',
        maxLoadCapacity: 6000,
      });
      expect(updated.model).toBe('Updated Model');
      expect(updated.maxLoadCapacity).toBe(6000);
    });

    test('should delete a vehicle', async () => {
      const created = await createTestVehicle();
      const result = await FleetService.deleteVehicle(created.id);
      expect(result.message).toBe('Vehicle deleted successfully');

      await expect(FleetService.getVehicleById(created.id)).rejects.toThrow('Vehicle not found');
    });
  });

  describe('Driver CRUD', () => {
    test('should create a driver successfully', async () => {
      const driver = await FleetService.createDriver({
        name: 'Raj Kumar',
        licenseNumber: 'DL-001',
        licenseCategory: 'Heavy',
        licenseExpiryDate: '2027-12-31',
        contactNumber: '9876543210',
      });

      expect(driver).toBeDefined();
      expect(driver.name).toBe('Raj Kumar');
      expect(driver.status).toBe('Available');
    });

    test('should throw on duplicate license number', async () => {
      await FleetService.createDriver({
        name: 'Raj Kumar',
        licenseNumber: 'DL-001',
        licenseCategory: 'Heavy',
        licenseExpiryDate: '2027-12-31',
        contactNumber: '9876543210',
      });

      await expect(
        FleetService.createDriver({
          name: 'Raj Kumar 2',
          licenseNumber: 'DL-001',
          licenseCategory: 'Light',
          licenseExpiryDate: '2027-12-31',
          contactNumber: '1234567890',
        })
      ).rejects.toThrow('already exists');
    });

    test('should get all drivers', async () => {
      await createTestDriver({ licenseNumber: 'DL-001' });
      await createTestDriver({ licenseNumber: 'DL-002' });

      const drivers = await FleetService.getAllDrivers();
      expect(drivers.length).toBe(2);
    });

    test('should filter drivers by status', async () => {
      await createTestDriver({ licenseNumber: 'DL-001', status: 'Available' });
      await createTestDriver({ licenseNumber: 'DL-002', status: 'Off Duty' });

      const available = await FleetService.getAllDrivers({ status: 'Available' });
      expect(available.length).toBe(1);
    });

    test('should get driver by ID', async () => {
      const created = await createTestDriver();
      const found = await FleetService.getDriverById(created.id);
      expect(found.id).toBe(created.id);
    });

    test('should update a driver', async () => {
      const created = await createTestDriver();
      const updated = await FleetService.updateDriver(created.id, { safetyScore: 85 });
      expect(updated.safetyScore).toBe(85);
    });

    test('should delete a driver', async () => {
      const created = await createTestDriver();
      const result = await FleetService.deleteDriver(created.id);
      expect(result.message).toBe('Driver deleted successfully');
    });
  });

  describe('Vehicle Documents', () => {
    test('should add a document to a vehicle', async () => {
      const vehicle = await createTestVehicle();
      const doc = await FleetService.addVehicleDocument(vehicle.id, {
        documentType: 'Insurance',
        documentNumber: 'INS-2026-001',
        expiryDate: '2027-06-30',
      });

      expect(doc).toBeDefined();
      expect(doc.documentType).toBe('Insurance');
      expect(doc.vehicleId).toBe(vehicle.id);
    });

    test('should throw when adding doc to non-existent vehicle', async () => {
      await expect(
        FleetService.addVehicleDocument(99999, {
          documentType: 'Insurance',
          documentNumber: 'INS-001',
          expiryDate: '2027-06-30',
        })
      ).rejects.toThrow('Vehicle not found');
    });

    test('should list vehicle documents', async () => {
      const vehicle = await createTestVehicle();
      await FleetService.addVehicleDocument(vehicle.id, {
        documentType: 'Insurance',
        documentNumber: 'INS-001',
        expiryDate: '2027-06-30',
      });

      const docs = await FleetService.getVehicleDocuments(vehicle.id);
      expect(docs.length).toBe(1);
    });

    test('should delete a vehicle document', async () => {
      const vehicle = await createTestVehicle();
      const doc = await FleetService.addVehicleDocument(vehicle.id, {
        documentType: 'Insurance',
        documentNumber: 'INS-001',
        expiryDate: '2027-06-30',
      });

      const result = await FleetService.deleteVehicleDocument(doc.id);
      expect(result.message).toBe('Vehicle document deleted successfully');
    });
  });
});
