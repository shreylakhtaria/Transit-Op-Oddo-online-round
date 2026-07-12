import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(8000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(3306),
  DB_NAME: z.string().default('transit_ops_db'),
  DB_USER: z.string().default('root'),
  DB_PASS: z.string().optional().default(''),
  // Managed MySQL (TiDB Cloud, Aiven, PlanetScale…) requires TLS; a local MySQL does not.
  // Parsed by hand rather than z.coerce.boolean(), which would turn the string "false" into true.
  DB_SSL: z
    .string()
    .optional()
    .default('false')
    .transform((v) => v === 'true' || v === '1'),

  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters long'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional().default('no-reply@transitops.com'),

  // Demo mode. When true, POST /auth/login also returns the OTP in the response so a
  // shared login (e.g. a judge using manager@transitops.com) can be completed without
  // access to that inbox, and OTP email failures no longer block login. NEVER enable
  // this on a deployment holding real user data — it defeats the second factor.
  EXPOSE_OTP: z
    .string()
    .optional()
    .default('false')
    .transform((v) => v === 'true' || v === '1'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
