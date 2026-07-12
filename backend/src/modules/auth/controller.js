import { AuthService } from './service.js';
import { registerSchema, loginSchema, refreshSchema, verifyOtpSchema } from './validators.js';

export class AuthController {
  static async register(req, res, next) {
    try {
      const parsedData = registerSchema.parse(req.body);
      const user = await AuthService.register(parsedData);
      return res.status(201).json(user);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message });
      }
      return res.status(400).json({ error: error.message });
    }
  }

  static async login(req, res, next) {
    try {
      const parsedData = loginSchema.parse(req.body);
      const result = await AuthService.login(parsedData);
      return res.status(200).json(result);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message });
      }
      return res.status(401).json({ error: error.message });
    }
  }

  static async verifyOtp(req, res, next) {
    try {
      const parsedData = verifyOtpSchema.parse(req.body);
      const result = await AuthService.verifyOtp(parsedData);
      return res.status(200).json(result);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message });
      }
      return res.status(400).json({ error: error.message });
    }
  }

  static async refresh(req, res, next) {
    try {
      const parsedData = refreshSchema.parse(req.body);
      const result = await AuthService.refresh(parsedData);
      return res.status(200).json(result);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message });
      }
      return res.status(401).json({ error: error.message });
    }
  }

  static async logout(req, res, next) {
    try {
      const parsedData = refreshSchema.parse(req.body);
      const result = await AuthService.logout(parsedData);
      return res.status(200).json(result);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message });
      }
      return res.status(400).json({ error: error.message });
    }
  }

  static async me(req, res, next) {
    try {
      return res.status(200).json({
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: { name: req.user.role?.name }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
