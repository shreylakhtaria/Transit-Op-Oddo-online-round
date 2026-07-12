import { Sequelize } from 'sequelize';
import { env } from './env.js';

export const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASS, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: 'mysql',
  logging: env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true
  }
});

export const testDbConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the MySQL database:', error);
    process.exit(1);
  }
};
