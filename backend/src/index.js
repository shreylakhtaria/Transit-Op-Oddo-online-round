import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { testDbConnection } from './config/database.js';
import apiRouter from './routes/index.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Route mounting
app.use('/api', apiRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error caught by global handler:', err.message || err);
  
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(status).json({
    error: message
  });
});

// Start Server
const startServer = async () => {
  // Test connection to database before starting the listener
  await testDbConnection();

  app.listen(env.PORT, () => {
    console.log(`🚀 TransitOps Backend is running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
  });
};

startServer();
