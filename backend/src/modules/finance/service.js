import { FuelLog, Expense, Vehicle, Trip, sequelize } from '../../models/index.js';
import { paginate } from '../../utils/pagination.js';

export class FinanceService {
  static async logFuel(data) {
    const transaction = await sequelize.transaction();
    try {
      const vehicle = await Vehicle.findByPk(data.vehicleId, { transaction });
      if (!vehicle) throw new Error('Vehicle not found');

      if (data.tripId) {
        const trip = await Trip.findByPk(data.tripId, { transaction });
        if (!trip) throw new Error('Trip not found');
      }

      const log = await FuelLog.create(data, { transaction });

      // Automatically duplicate as an Expense under 'Fuel' category
      await Expense.create({
        vehicleId: data.vehicleId,
        tripId: data.tripId || null,
        description: `Fuel logging (${data.liters} L)`,
        amount: data.cost,
        category: 'Fuel',
        date: data.date
      }, { transaction });

      await transaction.commit();
      return log;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async logExpense(data) {
    const vehicle = await Vehicle.findByPk(data.vehicleId);
    if (!vehicle) throw new Error('Vehicle not found');

    if (data.tripId) {
      const trip = await Trip.findByPk(data.tripId);
      if (!trip) throw new Error('Trip not found');
    }

    return await Expense.create(data);
  }

  static async getVehicleOperationalCost(vehicleId) {
    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) throw new Error('Vehicle not found');

    // Aggregate expenses by category for this vehicle
    const expenses = await Expense.findAll({
      where: { vehicleId }
    });

    let fuelCost = 0;
    let maintenanceCost = 0;
    let tollCost = 0;
    let otherCost = 0;

    expenses.forEach(exp => {
      if (exp.category === 'Fuel') fuelCost += exp.amount;
      else if (exp.category === 'Maintenance') maintenanceCost += exp.amount;
      else if (exp.category === 'Toll') tollCost += exp.amount;
      else otherCost += exp.amount;
    });

    return {
      vehicleId,
      registrationNumber: vehicle.registrationNumber,
      model: vehicle.model,
      fuelCost,
      maintenanceCost,
      tollCost,
      otherCost,
      totalOperationalCost: fuelCost + maintenanceCost, // Fuel + Maintenance
      totalExpenses: fuelCost + maintenanceCost + tollCost + otherCost
    };
  }

  static async getAllExpenses(filters = {}, pagination = null) {
    const where = {};
    if (filters.vehicleId) where.vehicleId = filters.vehicleId;
    if (filters.category) where.category = filters.category;
    return await paginate(Expense, {
      where,
      include: [{ model: Vehicle, as: 'vehicle', attributes: ['registrationNumber', 'model'] }],
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    }, pagination);
  }

  static async getFuelLogs(filters = {}) {
    const where = {};
    if (filters.vehicleId) where.vehicleId = filters.vehicleId;
    return await FuelLog.findAll({
      where,
      attributes: ['id', 'vehicleId', 'tripId', 'liters', 'cost', 'date'],
      include: [{ model: Vehicle, as: 'vehicle', attributes: ['id', 'registrationNumber', 'model'] }],
      order: [['date', 'DESC'], ['id', 'DESC']]
    });
  }
}
