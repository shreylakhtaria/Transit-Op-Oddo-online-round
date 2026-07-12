import { z } from 'zod';

export const updateUserRoleSchema = z.object({
  roleName: z.enum(['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst'], {
    errorMap: () => ({ message: 'Invalid role' })
  })
});
