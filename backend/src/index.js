import { env } from './config/env.js';
import { testDbConnection } from './config/database.js';
import app from './app.js';

/**
 * Standalone server entrypoint — local dev, Render, a VM, anything long-running.
 * Serverless uses api/index.js instead, which imports the same app without binding a port.
 */
const startServer = async () => {
  try {
    await testDbConnection();
  } catch (error) {
    console.error('❌ Unable to connect to the MySQL database:', error);
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    console.log(`🚀 TransitOps Backend is running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
  });
};

startServer();
