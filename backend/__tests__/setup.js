import express from 'express';
import jwt from 'jsonwebtoken';
import { sequelize } from '../src/config/database.js';
import { Role, User, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, Otp, RefreshToken, Setting, VehicleDocument } from '../src/models/index.js';
import apiRouter from '../src/routes/index.js';

export { sequelize, Role, User, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, Otp, RefreshToken, Setting, VehicleDocument };

// Kept in sync with jest.setup.js, which pins JWT_SECRET for the whole suite.
export const JWT_SECRET = 'supersecretjwtkey12345';
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

/**
 * Builds the real API surface (same router stack as src/index.js, minus the listener)
 * so route-level tests exercise requireAuth / requireRole for real.
 */
export function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  // Mirrors the global error handler in src/index.js.
  app.use((err, req, res, _next) => {
    return res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  });

  return app;
}

// Monotonic within a test file, which keeps generated emails unique without relying on
// random suffixes (setupTestDb() drops the tables between tests anyway).
let userSequence = 0;

/** Creates a User row with the given role. */
export async function createTestUser(roleName, overrides = {}) {
  const role = await Role.findOne({ where: { name: roleName } });
  if (!role) throw new Error(`Role "${roleName}" is not seeded in the test database`);

  userSequence += 1;
  return User.create({
    name: `Test ${roleName}`,
    email: `${roleName.replace(/\s+/g, '-').toLowerCase()}-${userSequence}@example.com`,
    password: 'password123',
    roleId: role.id,
    ...overrides,
  });
}

/** Signs an access token in exactly the shape AuthService.verifyOtp issues. */
export function signAccessToken(user, roleName) {
  return jwt.sign(
    { id: user.id, email: user.email, role: roleName },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

/** Creates a user with `roleName` and returns them alongside a ready-to-use bearer token. */
export async function authAs(roleName, overrides = {}) {
  const user = await createTestUser(roleName, overrides);
  return { user, token: signAccessToken(user, roleName) };
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
