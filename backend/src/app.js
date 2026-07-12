import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import apiRouter from './routes/index.js';

/**
 * The Express app, with no listener attached.
 *
 * Split out from index.js so it can be used two ways: index.js binds it to a port for
 * local/traditional hosting, and api/index.js exports it as a serverless handler (an
 * Express app is itself a `(req, res)` function, so no adapter is needed).
 */
export const app = express();

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

export default app;
