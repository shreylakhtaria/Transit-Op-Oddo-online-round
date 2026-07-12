import { SettingsService } from './service.js';
import { updateSettingsSchema } from './validators.js';

export class SettingsController {
  static async getSettings(req, res, next) {
    try {
      const settings = await SettingsService.getAllSettings();
      return res.status(200).json(settings);
    } catch (error) {
      next(error);
    }
  }

  static async updateSettings(req, res, next) {
    try {
      const parsedData = updateSettingsSchema.parse(req.body);
      const settings = await SettingsService.updateSettings(parsedData.settings);
      return res.status(200).json(settings);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message });
      }
      return res.status(400).json({ error: error.message });
    }
  }
}
