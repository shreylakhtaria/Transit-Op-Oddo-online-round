import { Vehicle, Driver, Trip, Expense, sequelize } from '../../models/index.js';
import { Op } from 'sequelize';

export class AnalyticsService {
  static async getDashboardStats(filters = {}) {
    const vehicleWhere = {};
    if (filters.type) vehicleWhere.type = filters.type;
    if (filters.status) vehicleWhere.status = filters.status;

    // Fetch all vehicles matching filters
    const vehicles = await Vehicle.findAll({ where: vehicleWhere });

    // KPI computations
    const activeVehicles = vehicles.filter(v => v.status === 'On Trip').length;
    const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
    const maintenanceVehicles = vehicles.filter(v => v.status === 'In Shop').length;

    const totalVehiclesCount = vehicles.length;
    const fleetUtilization = totalVehiclesCount > 0 
      ? Math.round((activeVehicles / totalVehiclesCount) * 1000) / 10 : 0;

    // Fetch trips count
    const activeTrips = await Trip.count({ where: { status: 'Dispatched' } });
    const pendingTrips = await Trip.count({ where: { status: 'Draft' } });

    // Fetch drivers count
    const driversOnDuty = await Driver.count({
      where: {
        status: { [Op.in]: ['Available', 'On Trip'] }
      }
    });

    // Chart Data calculations per vehicle
    const chartData = [];
    const allVehiclesForCharts = await Vehicle.findAll({ where: vehicleWhere });

    for (const vehicle of allVehiclesForCharts) {
      // 1. Operational Costs (Fuel + Maintenance)
      const fuelExpenses = await Expense.sum('amount', {
        where: { vehicleId: vehicle.id, category: 'Fuel' }
      }) || 0;

      const maintenanceExpenses = await Expense.sum('amount', {
        where: { vehicleId: vehicle.id, category: 'Maintenance' }
      }) || 0;

      const totalOpCost = fuelExpenses + maintenanceExpenses;

      // 2. Revenue from completed trips
      const revenue = await Trip.sum('revenue', {
        where: { vehicleId: vehicle.id, status: 'Completed' }
      }) || 0;

      // 3. ROI: (Revenue - (Maintenance + Fuel)) / Acquisition Cost
      const roiRaw = (revenue - totalOpCost) / vehicle.acquisitionCost;
      const roi = Math.round(roiRaw * 1000) / 10; // Convert to percentage, e.g. 15.5%

      // 4. Fuel Efficiency: Distance / Fuel
      const totalDistance = await Trip.sum('actualDistance', {
        where: { vehicleId: vehicle.id, status: 'Completed' }
      }) || 0;

      const totalFuel = await Trip.sum('fuelConsumed', {
        where: { vehicleId: vehicle.id, status: 'Completed' }
      }) || 0;

      const fuelEfficiency = totalFuel > 0 ? Math.round((totalDistance / totalFuel) * 10) / 10 : 0;

      chartData.push({
        id: vehicle.id,
        registrationNumber: vehicle.registrationNumber,
        model: vehicle.model,
        type: vehicle.type,
        odometer: vehicle.odometer,
        fuelCost: fuelExpenses,
        maintenanceCost: maintenanceExpenses,
        totalOperationalCost: totalOpCost,
        revenue,
        roi,
        fuelEfficiency
      });
    }

    // Fetch recent trips
    const recentTrips = await Trip.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Vehicle, as: 'vehicle', attributes: ['registrationNumber', 'model'] },
        { model: Driver, as: 'driver', attributes: ['name'] }
      ]
    });

    return {
      kpis: {
        activeVehicles,
        availableVehicles,
        vehiclesInMaintenance: maintenanceVehicles,
        activeTrips,
        pendingTrips,
        driversOnDuty,
        fleetUtilization // number (percentage value)
      },
      chartData,
      recentTrips
    };
  }

  static async generateCSVExport() {
    const stats = await this.getDashboardStats();
    const rows = [
      ['Registration Number', 'Model', 'Type', 'Odometer (km)', 'Fuel Cost ($)', 'Maintenance Cost ($)', 'Total Operational Cost ($)', 'Revenue ($)', 'ROI (%)', 'Fuel Efficiency (km/L)']
    ];

    stats.chartData.forEach(item => {
      rows.push([
        item.registrationNumber,
        item.model,
        item.type,
        item.odometer,
        item.fuelCost,
        item.maintenanceCost,
        item.totalOperationalCost,
        item.revenue,
        item.roi,
        item.fuelEfficiency
      ]);
    });

    return rows.map(r => r.join(',')).join('\n');
  }

  static async getMonthlyRevenue() {
    // Fetch completed trips
    const completedTrips = await Trip.findAll({
      where: { status: 'Completed' },
      attributes: ['completionDate', 'revenue']
    });

    const revenueMap = {};

    completedTrips.forEach(trip => {
      if (!trip.completionDate) return;
      const date = new Date(trip.completionDate);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!revenueMap[monthYear]) {
        revenueMap[monthYear] = 0;
      }
      revenueMap[monthYear] += trip.revenue;
    });

    // Convert map to sorted array
    const result = Object.keys(revenueMap).map(month => ({
      month,
      revenue: revenueMap[month]
    })).sort((a, b) => a.month.localeCompare(b.month));

    return result;
  }

  static async getTopCostliestVehicles(limit = 5) {
    const stats = await this.getDashboardStats();
    
    // Sort chartData by totalOperationalCost in descending order
    const sorted = [...stats.chartData].sort((a, b) => b.totalOperationalCost - a.totalOperationalCost);
    
    return sorted.slice(0, limit);
  }
}
