import { sequelize } from '../src/config/database.js';
import { Role, User, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, Otp, RefreshToken, Setting, VehicleDocument } from '../src/models/index.js';

export { sequelize, Role, User, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, Otp, RefreshToken, Setting, VehicleDocument };

export async function setupTestDb() {
  await sequelize.sync({ force: true });

  await Role.bulkCreate([
    { name: 'Fleet Manager' },
    { name: 'Driver' },
    { name: 'Safety Officer' },
    { name: 'Financial Analyst' },
  ]);
}

export async function createTestVehicle(overrides = {}) {
  const ts = Date.now() + Math.floor(Math.random() * 1000);
  return Vehicle.create({
    registrationNumber: `MH-${ts}-TEST`,
    model: 'Tata Ace',
    type: 'Truck',
    maxLoadCapacity: 5000,
    odometer: 10000,
    acquisitionCost: 50000,
    status: 'Available',
    ...overrides,
  });
}

export async function createTestDriver(overrides = {}) {
  const ts = Date.now() + Math.floor(Math.random() * 1000);
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);

  return Driver.create({
    name: 'Test Driver',
    licenseNumber: `DL-${ts}-TEST`,
    licenseCategory: 'Heavy Transport',
    licenseExpiryDate: futureDate.toISOString().split('T')[0],
    contactNumber: '9876543210',
    safetyScore: 100,
    status: 'Available',
    ...overrides,
  });
}

export async function createTestTrip(vehicleId, driverId, overrides = {}) {
  return Trip.create({
    source: 'Mumbai',
    destination: 'Pune',
    vehicleId,
    driverId,
    cargoWeight: 1000,
    plannedDistance: 200,
    status: 'Draft',
    ...overrides,
  });
}

export function createMockReqResNext(overrides = {}) {
  const req = {
    body: {},
    query: {},
    params: {},
    user: null,
    headers: {},
    ...overrides,
  };

  const res = {
    status: jest.fn(function () { return this; }),
    json: jest.fn(function () { return this; }),
    setHeader: jest.fn(function () { return this; }),
    send: jest.fn(function () { return this; }),
  };

  const next = jest.fn();

  return { req, res, next };
}
