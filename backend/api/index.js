/**
 * Vercel serverless entrypoint.
 *
 * An Express app is already a `(req, res)` handler, so exporting it is all Vercel needs —
 * no adapter, and deliberately no app.listen(). vercel.json rewrites every path here, so
 * Express still sees the original URL and its own `/api/...` mount matches as usual.
 *
 * The DB connection is NOT eagerly tested here: that would add a round-trip to every cold
 * start. Sequelize connects lazily on the first query, and a genuine failure surfaces as a
 * 500 through the global error handler.
 */
import app from '../src/app.js';

export default app;
