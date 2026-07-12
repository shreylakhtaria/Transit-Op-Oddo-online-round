import { z } from 'zod';

export const vehicleSchema = z.object({
  registrationNumber: z.string().min(2, 'Registration number is required').trim(),
  model: z.string().min(2, 'Model is required').trim(),
  type: z.string().min(2, 'Type is required').trim(),
  maxLoadCapacity: z.number().positive('Max load capacity must be positive'),
  odometer: z.number().nonnegative('Odometer reading cannot be negative'),
  acquisitionCost: z.number().positive('Acquisition cost must be positive'),
  status: z.enum(['Available', 'On Trip', 'In Shop', 'Retired']).default('Available')
});

export const updateVehicleStatusSchema = z.object({
  status: z.enum(['Available', 'On Trip', 'In Shop', 'Retired'])
});

export const driverSchema = z.object({
  name: z.string().min(2, 'Driver name is required').trim(),
  licenseNumber: z.string().min(2, 'License number is required').trim(),
  licenseCategory: z.string().min(2, 'License category is required').trim(),
  licenseExpiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'License expiry date must be in YYYY-MM-DD format'),
  contactNumber: z.string().min(5, 'Contact number is required').trim(),
  safetyScore: z.number().min(0).max(100).default(100),
  status: z.enum(['Available', 'On Trip', 'Off Duty', 'Suspended']).default('Available'),
  userId: z.string().uuid('Invalid user ID').optional().nullable()
});

export const updateDriverStatusSchema = z.object({
  status: z.enum(['Available', 'On Trip', 'Off Duty', 'Suspended'])
});
