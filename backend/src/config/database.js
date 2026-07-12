import { Sequelize } from 'sequelize';
import mysql2 from 'mysql2';
import { env } from './env.js';

// Managed MySQL providers (TiDB Cloud, Aiven, PlanetScale…) refuse plaintext connections.
// A local MySQL doesn't use TLS, so this stays opt-in and local development is unchanged.
const dialectOptions = env.DB_SSL
  ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } }
  : {};

// Serverless keeps many instances warm, each holding its own pool. `min: 2` meant every
// warm instance pinned two connections open, which burns through a free MySQL tier's
// connection cap. In production, use a small pool that can drain back to zero.
const pool =
  env.NODE_ENV === 'production'
    ? { max: 2, min: 0, acquire: 30000, idle: 5000 }
    : { max: 10, min: 2, acquire: 30000, idle: 10000 };

export const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASS, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: 'mysql',
  // Sequelize normally loads the driver with a dynamic require('mysql2'), which a
  // serverless bundler cannot trace — so mysql2 gets left out of the deployed function
  // and it fails at runtime with "Please install mysql2 package manually". Handing it the
  // module makes the dependency statically visible. Harmless outside serverless.
  dialectModule: mysql2,
  dialectOptions,
  logging: env.NODE_ENV === 'development' ? console.log : false,
  pool,
  define: {
    timestamps: true
  }
});

/**
 * Throws on failure instead of calling process.exit(1): inside a serverless function that
 * would tear down the whole instance rather than failing one request. The standalone
 * server (src/index.js) catches this and exits itself.
 */
export const testDbConnection = async () => {
  await sequelize.authenticate();
  console.log('✅ MySQL Database connection established successfully.');
};
