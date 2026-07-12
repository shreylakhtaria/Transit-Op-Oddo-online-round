import { z } from 'zod';

export const createMaintenanceSchema = z.object({
  vehicleId: z.number().int().positive('Vehicle ID is required'),
  description: z.string().min(2, 'Description is required').trim(),
  cost: z.number().nonnegative('Cost cannot be negative'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
});
