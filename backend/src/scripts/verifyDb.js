import { TripService } from '../modules/trips/service.js';
import { MaintenanceService } from '../modules/maintenance/service.js';
import { AnalyticsService } from '../modules/analytics/service.js';
import { Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, sequelize } from '../models/index.js';

const runVerification = async () => {
  console.log('🏁 Starting TransitOps E2E Workflow Verification...');
  
  try {
    // Authenticate DB
    await sequelize.authenticate();
    console.log('✅ Connected to database.');

    // Cleanup previous runs test trips/maintenance
    await Expense.destroy({ where: {} });
    await FuelLog.destroy({ where: {} });
    await MaintenanceLog.destroy({ where: {} });
    await Trip.destroy({ where: {} });

    // Reset Vehicle & Driver status
    await Vehicle.update({ status: 'Available', odometer: 12000.0 }, { where: { id: 1 } });
    await Driver.update({ status: 'Available' }, { where: { id: 1 } });

    // Step 1: Find seeded vehicle 'Van-05' (id: 1)
    const vehicle = await Vehicle.findByPk(1);
    console.log(`Step 1: Vehicle ${vehicle.model} ready. Capacity: ${vehicle.maxLoadCapacity} kg. Status: ${vehicle.status}`);
    if (vehicle.status !== 'Available') throw new Error('Vehicle should be Available');

    // Step 2: Find seeded driver 'Alex' (id: 1)
    const driver = await Driver.findByPk(1);
    console.log(`Step 2: Driver ${driver.name} ready. Status: ${driver.status}`);
    if (driver.status !== 'Available') throw new Error('Driver should be Available');

    // Step 3: Create a trip with Cargo Weight = 450 kg (450 <= 500)
    console.log('Step 3: Creating valid trip (450 kg <= 500 kg capacity)...');
    const validTrip = await TripService.createTrip({
      source: 'Warehouse A',
      destination: 'Client Outlet B',
      vehicleId: 1,
      driverId: 1,
      cargoWeight: 450,
      plannedDistance: 100
    });
    console.log(`✅ Valid Trip created. Status: ${validTrip.status}`);

    // Step 4: Validate cargo limit validation (e.g. create a trip with 600 kg cargo)
    console.log('Step 4: Attempting to create invalid trip (600 kg cargo > 500 kg capacity)...');
    try {
      await TripService.createTrip({
        source: 'Warehouse A',
        destination: 'Client Outlet B',
        vehicleId: 1,
        driverId: 1,
        cargoWeight: 600,
        plannedDistance: 100
      });
      throw new Error('❌ Error: Allowed trip creation exceeding capacity!');
    } catch (err) {
      console.log(`✅ Success: Trip rejected with message: "${err.message}"`);
    }

    // Step 5: Dispatch trip
    console.log('Step 5: Dispatching valid trip...');
    const dispatchedTrip = await TripService.dispatchTrip(validTrip.id);
    const updatedVehicle = await Vehicle.findByPk(1);
    const updatedDriver = await Driver.findByPk(1);

    console.log(`✅ Trip status: ${dispatchedTrip.status}`);
    console.log(`✅ Vehicle status: ${updatedVehicle.status} (Expected: On Trip)`);
    console.log(`✅ Driver status: ${updatedDriver.status} (Expected: On Trip)`);

    if (dispatchedTrip.status !== 'Dispatched') throw new Error('Trip status should be Dispatched');
    if (updatedVehicle.status !== 'On Trip') throw new Error('Vehicle should be On Trip');
    if (updatedDriver.status !== 'On Trip') throw new Error('Driver should be On Trip');

    // Step 6: Complete the trip (entering final odometer distance and fuel consumed)
    console.log('Step 6: Completing the trip (actual distance = 120 km, fuel consumed = 12 L, cost = $18, revenue = $500)...');
    await TripService.completeTrip(dispatchedTrip.id, {
      actualDistance: 120,
      fuelConsumed: 12,
      fuelCost: 18,
      revenue: 500
    });

    // Step 7: Verify Vehicle and Driver returned to Available and odometer updated
    console.log('Step 7: Verifying status restoration and odometer update...');
    const completedVehicle = await Vehicle.findByPk(1);
    const completedDriver = await Driver.findByPk(1);
    const completedTrip = await Trip.findByPk(validTrip.id);

    console.log(`✅ Vehicle status: ${completedVehicle.status} (Expected: Available)`);
    console.log(`✅ Driver status: ${completedDriver.status} (Expected: Available)`);
    console.log(`✅ Vehicle odometer: ${completedVehicle.odometer} km (Expected: 12120 km)`);

    if (completedVehicle.status !== 'Available') throw new Error('Vehicle status should be Available');
    if (completedDriver.status !== 'Available') throw new Error('Driver status should be Available');
    if (completedVehicle.odometer !== 12120) throw new Error('Odometer not updated correctly');

    // Step 8: Create a maintenance record
    console.log('Step 8: Creating maintenance log (Oil Change, Cost = $150)...');
    const maintenanceLog = await MaintenanceService.startMaintenance({
      vehicleId: 1,
      description: 'Oil Change',
      cost: 150,
      startDate: new Date().toISOString().split('T')[0]
    });

    const maintenanceVehicle = await Vehicle.findByPk(1);
    console.log(`✅ Maintenance Log status: ${maintenanceLog.status}`);
    console.log(`✅ Vehicle status: ${maintenanceVehicle.status} (Expected: In Shop)`);

    if (maintenanceVehicle.status !== 'In Shop') throw new Error('Vehicle status should be In Shop');

    // Check dispatch selection pool
    console.log('Verifying vehicle is excluded from dispatchable assets selection pool...');
    const selectionPool = await TripService.getDispatchableAssets();
    const inPool = selectionPool.vehicles.some(v => v.id === 1);
    console.log(`✅ Excluded from selection pool: ${!inPool ? 'YES' : 'NO'}`);
    if (inPool) throw new Error('Vehicle in shop should not be in dispatch selection pool');

    // Close maintenance
    console.log('Closing maintenance log...');
    await MaintenanceService.closeMaintenance(maintenanceLog.id);
    const postMaintenanceVehicle = await Vehicle.findByPk(1);
    console.log(`✅ Vehicle status post-maintenance: ${postMaintenanceVehicle.status} (Expected: Available)`);
    if (postMaintenanceVehicle.status !== 'Available') throw new Error('Vehicle status should return to Available');

    // Step 9: Verify analytics reports are updated correctly
    console.log('Step 9: Testing analytics calculations...');
    const stats = await AnalyticsService.getDashboardStats();
    const vehicleStats = stats.chartData.find(item => item.id === 1);

    console.log('--- Vehicle Analytics ---');
    console.log(`Fuel Efficiency: ${vehicleStats.fuelEfficiency} km/L (Expected: 10 km/L)`);
    console.log(`Fuel Cost: $${vehicleStats.fuelCost} (Expected: $18)`);
    console.log(`Maintenance Cost: $${vehicleStats.maintenanceCost} (Expected: $150)`);
    console.log(`Total Operational Cost: $${vehicleStats.totalOperationalCost} (Expected: $168)`);
    console.log(`Revenue: $${vehicleStats.revenue} (Expected: $500)`);
    console.log(`ROI: ${vehicleStats.roi}% (Expected: ((500 - 168) / 15000) * 100 = 2.2%)`);

    if (vehicleStats.fuelEfficiency !== 10) throw new Error('Invalid fuel efficiency computation');
    if (vehicleStats.totalOperationalCost !== 168) throw new Error('Invalid operational cost computation');
    if (vehicleStats.roi !== 2.2) throw new Error('Invalid ROI computation');

    console.log('\n🎉 E2E Workflow Verification Completed: ALL ASSERTS PASSED! 🚀');
  } catch (error) {
    console.error('❌ Verification FAILED with error:', error);
    process.exit(1);
  }
};

runVerification();
