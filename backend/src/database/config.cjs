const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Managed MySQL requires TLS. Opt-in, so migrations against a local MySQL still work.
const dialectOptions =
  process.env.DB_SSL === 'true' || process.env.DB_SSL === '1'
    ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } }
    : {};

const base = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || null,
  database: process.env.DB_NAME || 'transit_ops_db',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  dialect: 'mysql',
  dialectOptions,
  migrationStorageTableName: 'sequelize_meta'
};

module.exports = {
  development: base,
  production: {
    ...base,
    username: process.env.DB_USER,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST
  }
};
