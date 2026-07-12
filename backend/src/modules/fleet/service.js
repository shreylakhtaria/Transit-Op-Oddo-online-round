import { Vehicle, Driver, User, Role, VehicleDocument } from '../../models/index.js';
import { Op } from 'sequelize';
import { paginate } from '../../utils/pagination.js';

export class FleetService {
  // --- Vehicle CRUD ---

  static async createVehicle(data) {
    const existing = await Vehicle.findOne({ where: { registrationNumber: data.registrationNumber } });
    if (existing) {
      throw new Error(`Vehicle with registration number ${data.registrationNumber} already exists`);
    }
    return await Vehicle.create(data);
  }

  static async getAllVehicles(filters = {}, pagination = null) {
    const where = {};
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    return await paginate(Vehicle, { where, order: [['createdAt', 'DESC']] }, pagination);
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

  static async getAllDrivers(filters = {}, pagination = null) {
    const where = {};
    if (filters.status) where.status = filters.status;
    return await paginate(Driver, {
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']]
    }, pagination);
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

  static async sendLicenseExpiryReminders() {
    const { sendEmail } = await import('../../config/mailer.js');
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const todayStr = today.toISOString().split('T')[0];
    const targetStr = thirtyDaysFromNow.toISOString().split('T')[0];

    const expiringDrivers = await Driver.findAll({
      where: {
        licenseExpiryDate: {
          [Op.between]: [todayStr, targetStr]
        }
      },
      include: [{ model: User, as: 'user', attributes: ['email', 'name'] }]
    });

    const results = [];

    for (const driver of expiringDrivers) {
      const emailRecipient = driver.user?.email || 'safety@transitops.com';
      const emailName = driver.user?.name || driver.name;
      const message = `Dear ${emailName},\n\nThis is a friendly reminder that driver ${driver.name}'s license (Number: ${driver.licenseNumber}) is expiring on ${driver.licenseExpiryDate}.\n\nPlease renew the license as soon as possible to avoid trip dispatch blocks.\n\nBest regards,\nTransitOps Safety Department`;

      await sendEmail({
        to: emailRecipient,
        subject: `TransitOps License Expiration Reminder: ${driver.name}`,
        text: message
      });

      results.push({
        driverId: driver.id,
        driverName: driver.name,
        licenseNumber: driver.licenseNumber,
        expiryDate: driver.licenseExpiryDate,
        sentTo: emailRecipient
      });
    }

    return {
      message: `Checked for expiring licenses. Sent ${results.length} reminders.`,
      remindersSent: results
    };
  }

  // --- Vehicle Document Management ---

  static async addVehicleDocument(vehicleId, data) {
    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) throw new Error('Vehicle not found');

    return await VehicleDocument.create({
      vehicleId,
      ...data
    });
  }

  static async getVehicleDocuments(vehicleId) {
    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) throw new Error('Vehicle not found');

    return await VehicleDocument.findAll({
      where: { vehicleId },
      order: [['expiryDate', 'ASC']]
    });
  }

  static async deleteVehicleDocument(id) {
    const doc = await VehicleDocument.findByPk(id);
    if (!doc) throw new Error('Document not found');
    await doc.destroy();
    return { message: 'Vehicle document deleted successfully' };
  }
}
