import { z } from 'zod';

export const fuelLogSchema = z.object({
  vehicleId: z.number().int().positive('Vehicle ID is required'),
  tripId: z.number().int().positive('Trip ID').optional().nullable(),
  liters: z.number().positive('Liters must be positive'),
  cost: z.number().positive('Cost must be positive'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
});

export const expenseSchema = z.object({
  vehicleId: z.number().int().positive('Vehicle ID is required'),
  tripId: z.number().int().positive('Trip ID').optional().nullable(),
  description: z.string().min(2, 'Description is required').trim(),
  amount: z.number().positive('Amount must be positive'),
  category: z.enum(['Fuel', 'Maintenance', 'Toll', 'Other']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
});
