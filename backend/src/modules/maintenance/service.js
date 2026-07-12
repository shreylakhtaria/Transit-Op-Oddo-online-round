import { MaintenanceLog, Vehicle, Expense, sequelize } from '../../models/index.js';

export class MaintenanceService {
  static async startMaintenance({ vehicleId, description, cost, startDate }) {
    const transaction = await sequelize.transaction();
    try {
      const vehicle = await Vehicle.findByPk(vehicleId, { transaction });
      if (!vehicle) throw new Error('Vehicle not found');

      if (vehicle.status === 'On Trip') {
        throw new Error('Vehicle is currently on a trip and cannot enter maintenance');
      }

      const log = await MaintenanceLog.create({
        vehicleId,
        description,
        cost,
        startDate,
        status: 'Active'
      }, { transaction });

      // Business Rule: Creating an active maintenance record automatically changes vehicle status to In Shop.
      await vehicle.update({ status: 'In Shop' }, { transaction });

      // Automatically log the cost into Expenses as Maintenance category
      await Expense.create({
        vehicleId,
        description: `Maintenance: ${description}`,
        amount: cost,
        category: 'Maintenance',
        date: startDate
      }, { transaction });

      await transaction.commit();
      return log;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async closeMaintenance(id, endDate) {
    const transaction = await sequelize.transaction();
    try {
      const log = await MaintenanceLog.findByPk(id, { transaction });
      if (!log) throw new Error('Maintenance record not found');

      if (log.status === 'Closed') {
        throw new Error('Maintenance record is already closed');
      }

      const end = endDate || new Date().toISOString().split('T')[0];

      await log.update({
        status: 'Closed',
        endDate: end
      }, { transaction });

      const vehicle = await Vehicle.findByPk(log.vehicleId, { transaction });
      
      // Business Rule: Closing maintenance restores the vehicle to Available (unless retired).
      if (vehicle && vehicle.status !== 'Retired') {
        await vehicle.update({ status: 'Available' }, { transaction });
      }

      await transaction.commit();
      return log;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async getAllLogs(filters = {}) {
    const where = {};
    if (filters.status) where.status = filters.status;
    return await MaintenanceLog.findAll({
      where,
      include: [{ model: Vehicle, as: 'vehicle', attributes: ['registrationNumber', 'model'] }],
      order: [['createdAt', 'DESC']]
    });
  }
}
