import { describe, test, expect } from '@jest/globals';
import { registerSchema, loginSchema, refreshSchema, verifyOtpSchema } from '../src/modules/auth/validators.js';
import { vehicleSchema, driverSchema, vehicleDocumentSchema } from '../src/modules/fleet/validators.js';
import { createTripSchema, completeTripSchema } from '../src/modules/trips/validators.js';
import { createMaintenanceSchema } from '../src/modules/maintenance/validators.js';
import { fuelLogSchema, expenseSchema } from '../src/modules/finance/validators.js';
import { updateSettingsSchema } from '../src/modules/settings/validators.js';

describe('Validators (Zod Schemas)', () => {
  describe('registerSchema', () => {
    test('should accept valid data', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'pass123',
        roleName: 'Fleet Manager',
      });
      expect(result.success).toBe(true);
    });

    test('should reject invalid email', () => {
      const result = registerSchema.safeParse({
        name: 'John',
        email: 'not-an-email',
        password: 'pass123',
        roleName: 'Driver',
      });
      expect(result.success).toBe(false);
    });

    test('should reject short password', () => {
      const result = registerSchema.safeParse({
        name: 'John',
        email: 'john@test.com',
        password: '12345',
        roleName: 'Driver',
      });
      expect(result.success).toBe(false);
    });

    test('should reject invalid role', () => {
      const result = registerSchema.safeParse({
        name: 'John',
        email: 'john@test.com',
        password: 'pass123',
        roleName: 'CEO',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    test('should accept valid data', () => {
      const result = loginSchema.safeParse({ email: 'a@b.com', password: 'pass' });
      expect(result.success).toBe(true);
    });

    test('should reject missing password', () => {
      const result = loginSchema.safeParse({ email: 'a@b.com', password: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('vehicleSchema', () => {
    test('should accept valid data', () => {
      const result = vehicleSchema.safeParse({
        registrationNumber: 'MH-01-AB-1234',
        model: 'Tata Ace',
        type: 'Truck',
        maxLoadCapacity: 5000,
        odometer: 10000,
        acquisitionCost: 50000,
      });
      expect(result.success).toBe(true);
    });

    test('should default status to Available', () => {
      const result = vehicleSchema.parse({
        registrationNumber: 'MH-01-AB-1234',
        model: 'Tata Ace',
        type: 'Truck',
        maxLoadCapacity: 5000,
        odometer: 10000,
        acquisitionCost: 50000,
      });
      expect(result.status).toBe('Available');
    });

    test('should reject negative maxLoadCapacity', () => {
      const result = vehicleSchema.safeParse({
        registrationNumber: 'MH-01-AB-1234',
        model: 'Tata Ace',
        type: 'Truck',
        maxLoadCapacity: -100,
        odometer: 10000,
        acquisitionCost: 50000,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('driverSchema', () => {
    test('should accept valid data', () => {
      const result = driverSchema.safeParse({
        name: 'Raj Kumar',
        licenseNumber: 'DL-001',
        licenseCategory: 'Heavy',
        licenseExpiryDate: '2027-12-31',
        contactNumber: '9876543210',
      });
      expect(result.success).toBe(true);
    });

    test('should reject invalid date format', () => {
      const result = driverSchema.safeParse({
        name: 'Raj',
        licenseNumber: 'DL-001',
        licenseCategory: 'Heavy',
        licenseExpiryDate: '31-12-2027',
        contactNumber: '9876543210',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createTripSchema', () => {
    test('should accept valid data', () => {
      const result = createTripSchema.safeParse({
        source: 'Mumbai',
        destination: 'Pune',
        vehicleId: 1,
        driverId: 1,
        cargoWeight: 1000,
        plannedDistance: 200,
      });
      expect(result.success).toBe(true);
    });

    test('should reject negative cargoWeight', () => {
      const result = createTripSchema.safeParse({
        source: 'Mumbai',
        destination: 'Pune',
        vehicleId: 1,
        driverId: 1,
        cargoWeight: -100,
        plannedDistance: 200,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('completeTripSchema', () => {
    test('should accept valid data', () => {
      const result = completeTripSchema.safeParse({
        actualDistance: 180,
        fuelConsumed: 45,
        revenue: 5000,
      });
      expect(result.success).toBe(true);
    });

    test('should accept optional fuelCost', () => {
      const result = completeTripSchema.safeParse({
        actualDistance: 180,
        fuelConsumed: 45,
        fuelCost: 70,
        revenue: 5000,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('createMaintenanceSchema', () => {
    test('should accept valid data', () => {
      const result = createMaintenanceSchema.safeParse({
        vehicleId: 1,
        description: 'Oil change',
        cost: 50,
        startDate: '2026-07-15',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('fuelLogSchema', () => {
    test('should accept valid data', () => {
      const result = fuelLogSchema.safeParse({
        vehicleId: 1,
        liters: 50,
        cost: 75,
        date: '2026-07-12',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('expenseSchema', () => {
    test('should accept valid data', () => {
      const result = expenseSchema.safeParse({
        vehicleId: 1,
        description: 'Toll',
        amount: 200,
        category: 'Toll',
        date: '2026-07-12',
      });
      expect(result.success).toBe(true);
    });

    test('should reject invalid category', () => {
      const result = expenseSchema.safeParse({
        vehicleId: 1,
        description: 'Toll',
        amount: 200,
        category: 'Parking',
        date: '2026-07-12',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateSettingsSchema', () => {
    test('should accept valid data', () => {
      const result = updateSettingsSchema.safeParse({
        settings: [
          { key: 'fuel_price', value: '1.5' },
        ],
      });
      expect(result.success).toBe(true);
    });

    test('should reject empty key', () => {
      const result = updateSettingsSchema.safeParse({
        settings: [{ key: '', value: '1.5' }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('vehicleDocumentSchema', () => {
    test('should accept valid data', () => {
      const result = vehicleDocumentSchema.safeParse({
        documentType: 'Insurance',
        documentNumber: 'INS-2026-001',
        expiryDate: '2027-06-30',
      });
      expect(result.success).toBe(true);
    });
  });
});
