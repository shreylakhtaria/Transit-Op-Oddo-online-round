import { Vehicle, Driver, User, Role } from '../../models/index.js';
import { Op } from 'sequelize';

export class FleetService {
  // --- Vehicle CRUD ---

  static async createVehicle(data) {
    const existing = await Vehicle.findOne({ where: { registrationNumber: data.registrationNumber } });
    if (existing) {
      throw new Error(`Vehicle with registration number ${data.registrationNumber} already exists`);
    }
    return await Vehicle.create(data);
  }

  static async getAllVehicles(filters = {}) {
    const where = {};
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    return await Vehicle.findAll({ where, order: [['createdAt', 'DESC']] });
  }

  static async getVehicleById(id) {
    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) throw new Error('Vehicle not found');
    return vehicle;
  }

  static async updateVehicle(id, data) {
    const vehicle = await this.getVehicleById(id);
    
    if (data.registrationNumber && data.registrationNumber !== vehicle.registrationNumber) {
      const existing = await Vehicle.findOne({ where: { registrationNumber: data.registrationNumber } });
      if (existing) {
        throw new Error(`Vehicle with registration number ${data.registrationNumber} already exists`);
      }
    }

    await vehicle.update(data);
    return vehicle;
  }

  static async deleteVehicle(id) {
    const vehicle = await this.getVehicleById(id);
    await vehicle.destroy();
    return { message: 'Vehicle deleted successfully' };
  }

  // --- Driver CRUD ---

  static async createDriver(data) {
    const existing = await Driver.findOne({ where: { licenseNumber: data.licenseNumber } });
    if (existing) {
      throw new Error(`Driver with license number ${data.licenseNumber} already exists`);
    }
    return await Driver.create(data);
  }

  static async getAllDrivers(filters = {}) {
    const where = {};
    if (filters.status) where.status = filters.status;
    return await Driver.findAll({ 
      where, 
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']] 
    });
  }

  static async getDriverById(id) {
    const driver = await Driver.findByPk(id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
    });
    if (!driver) throw new Error('Driver not found');
    return driver;
  }

  static async updateDriver(id, data) {
    const driver = await this.getDriverById(id);

    if (data.licenseNumber && data.licenseNumber !== driver.licenseNumber) {
      const existing = await Driver.findOne({ where: { licenseNumber: data.licenseNumber } });
      if (existing) {
        throw new Error(`Driver with license number ${data.licenseNumber} already exists`);
      }
    }

    await driver.update(data);
    return driver;
  }

  static async deleteDriver(id) {
    const driver = await this.getDriverById(id);
    await driver.destroy();
    return { message: 'Driver deleted successfully' };
  }
}
