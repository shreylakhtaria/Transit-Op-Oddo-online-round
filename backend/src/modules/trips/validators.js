import { z } from 'zod';

export const createTripSchema = z.object({
  source: z.string().min(2, 'Source is required').trim(),
  destination: z.string().min(2, 'Destination is required').trim(),
  vehicleId: z.number().int().positive('Vehicle ID is required'),
  driverId: z.number().int().positive('Driver ID is required'),
  cargoWeight: z.number().positive('Cargo weight must be positive'),
  plannedDistance: z.number().positive('Planned distance must be positive')
});

export const completeTripSchema = z.object({
  actualDistance: z.number().positive('Actual distance must be positive'),
  fuelConsumed: z.number().positive('Fuel consumed in liters must be positive'),
  fuelCost: z.number().positive('Fuel cost must be positive').optional(),
  revenue: z.number().nonnegative('Revenue cannot be negative')
});
