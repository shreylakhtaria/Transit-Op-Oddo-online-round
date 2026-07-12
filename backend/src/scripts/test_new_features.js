import { sequelize } from '../config/database.js';
import { AnalyticsService } from '../modules/analytics/service.js';
import { SettingsService } from '../modules/settings/service.js';
import { Setting } from '../models/index.js';

async function testNewFeatures() {
  console.log('Testing AnalyticsService.getDashboardStats() with recentTrips...');
  const stats = await AnalyticsService.getDashboardStats();
  if (!stats.recentTrips) {
    console.error('❌ recentTrips missing from dashboard stats');
    process.exit(1);
  }
  console.log(`✅ Dashboard stats include ${stats.recentTrips.length} recent trips.`);

  console.log('\nTesting AnalyticsService.getMonthlyRevenue()...');
  const monthlyRevenue = await AnalyticsService.getMonthlyRevenue();
  console.log('✅ Monthly revenue:', monthlyRevenue);

  console.log('\nTesting AnalyticsService.getTopCostliestVehicles()...');
  const topCostliest = await AnalyticsService.getTopCostliestVehicles();
  console.log('✅ Top costliest vehicles count:', topCostliest.length);
  if (topCostliest.length > 0) {
    console.log(`Highest cost: ${topCostliest[0].registrationNumber} ($${topCostliest[0].totalOperationalCost})`);
  }

  console.log('\nTesting SettingsService...');
  const allSettings = await SettingsService.getAllSettings();
  console.log('✅ Initial Settings:', allSettings);
  
  if (Object.keys(allSettings).length === 0) {
    console.error('❌ No settings found in DB. Did migration run properly?');
    process.exit(1);
  }

  console.log('\n✅ All new features tests passed!');
  process.exit(0);
}

testNewFeatures().catch(console.error);
