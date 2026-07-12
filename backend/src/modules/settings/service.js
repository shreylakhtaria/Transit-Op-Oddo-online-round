import { Setting } from '../../models/index.js';

export class SettingsService {
  static async getAllSettings() {
    const settings = await Setting.findAll();
    const formattedSettings = {};
    settings.forEach(s => {
      formattedSettings[s.key] = s.value;
    });
    return formattedSettings;
  }

  static async updateSettings(settingsList) {
    for (const item of settingsList) {
      await Setting.upsert({
        key: item.key,
        value: item.value
      });
    }
    return await this.getAllSettings();
  }
}
