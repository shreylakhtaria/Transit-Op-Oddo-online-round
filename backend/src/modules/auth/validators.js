import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  roleName: z.enum(['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst'], {
    errorMap: () => ({ message: 'Invalid role' })
  })
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

export const verifyOtpSchema = z.object({
  tempToken: z.string().min(1, 'Temporary token is required'),
  code: z.string().length(6, 'OTP must be exactly 6 digits')
});

