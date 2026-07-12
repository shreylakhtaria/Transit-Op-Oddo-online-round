'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const passwordHash = await bcrypt.hash('password123', 10);
    const now = new Date();

    // 1. Seed Roles
    await queryInterface.bulkInsert('Roles', [
      { id: 1, name: 'Fleet Manager', createdAt: now, updatedAt: now },
      { id: 2, name: 'Driver', createdAt: now, updatedAt: now },
      { id: 3, name: 'Safety Officer', createdAt: now, updatedAt: now },
      { id: 4, name: 'Financial Analyst', createdAt: now, updatedAt: now }
    ], {});

    // 2. Seed Users
    const managerId = 'a1111111-1111-4111-a111-111111111111';
    const driverId = 'b2222222-2222-4222-a222-222222222222';
    const safetyId = 'c3333333-3333-4333-a333-333333333333';
    const financeId = 'd4444444-4444-4444-a444-444444444444';

    await queryInterface.bulkInsert('Users', [
      {
        id: managerId,
        name: 'Fleet Manager User',
        email: 'manager@transitops.com',
        password: passwordHash,
        roleId: 1,
        createdAt: now,
        updatedAt: now
      },
      {
        id: driverId,
        name: 'Alex Driver User',
        email: 'driver@transitops.com',
        password: passwordHash,
        roleId: 2,
        createdAt: now,
        updatedAt: now
      },
      {
        id: safetyId,
        name: 'Safety Officer User',
        email: 'safety@transitops.com',
        password: passwordHash,
        roleId: 3,
        createdAt: now,
        updatedAt: now
      },
      {
        id: financeId,
        name: 'Financial Analyst User',
        email: 'finance@transitops.com',
        password: passwordHash,
        roleId: 4,
        createdAt: now,
        updatedAt: now
      }
    ], {});

    // 3. Seed Vehicles
    await queryInterface.bulkInsert('Vehicles', [
      {
        id: 1,
        registrationNumber: 'MH-12-HE-05',
        model: 'Van-05',
        type: 'Van',
        maxLoadCapacity: 500.0,
        odometer: 12000.0,
        acquisitionCost: 15000.0,
        status: 'Available',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 2,
        registrationNumber: 'MH-12-TR-10',
        model: 'Truck-10',
        type: 'Truck',
        maxLoadCapacity: 5000.0,
        odometer: 85000.0,
        acquisitionCost: 45000.0,
        status: 'Available',
        createdAt: now,
        updatedAt: now
      }
    ], {});

    // 4. Seed Drivers (Associate driver user 'Alex' to driver profile)
    await queryInterface.bulkInsert('Drivers', [
      {
        id: 1,
        name: 'Alex',
        licenseNumber: 'DL-12-ALEX',
        licenseCategory: 'Heavy Transport',
        licenseExpiryDate: '2030-12-31',
        contactNumber: '+919876543211',
        safetyScore: 95.5,
        status: 'Available',
        userId: driverId,
        createdAt: now,
        updatedAt: now
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Drivers', null, {});
    await queryInterface.bulkDelete('Vehicles', null, {});
    await queryInterface.bulkDelete('Users', null, {});
    await queryInterface.bulkDelete('Roles', null, {});
  }
};
