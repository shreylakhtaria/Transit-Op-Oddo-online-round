import { describe, test, expect, beforeEach } from '@jest/globals';
import { setupTestDb, Setting } from './setup.js';
import { SettingsService } from '../src/modules/settings/service.js';

describe('Settings Module', () => {
  beforeEach(async () => {
    await setupTestDb();
  });

  describe('getAllSettings', () => {
    test('should return settings as key-value object', async () => {
      await Setting.bulkCreate([
        { key: 'company_name', value: 'TransitOps' },
        { key: 'fuel_price', value: '1.5' },
      ]);

      const settings = await SettingsService.getAllSettings();
      expect(settings.company_name).toBe('TransitOps');
      expect(settings.fuel_price).toBe('1.5');
    });

    test('should return empty object when no settings', async () => {
      const settings = await SettingsService.getAllSettings();
      expect(Object.keys(settings).length).toBe(0);
    });
  });

  describe('updateSettings', () => {
    test('should upsert settings', async () => {
      await SettingsService.updateSettings([
        { key: 'company_name', value: 'TransitOps' },
        { key: 'fuel_price', value: '1.5' },
      ]);

      const updated = await SettingsService.updateSettings([
        { key: 'fuel_price', value: '2.0' },
        { key: 'toll_rate', value: '0.5' },
      ]);

      expect(updated.company_name).toBe('TransitOps');
      expect(updated.fuel_price).toBe('2.0');
      expect(updated.toll_rate).toBe('0.5');
    });
  });
});
