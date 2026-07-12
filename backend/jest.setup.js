// Deterministic environment for the test suite.
//
// `src/config/env.js` hard-requires JWT_SECRET and calls process.exit(1) when it is
// missing, but `backend/.env` is gitignored and therefore absent from a fresh clone.
// Pinning the test secret here makes `npm test` hermetic: dotenv never overrides a
// variable that is already set, so this value wins over any local .env, and the suite
// no longer depends on a developer's machine configuration.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'supersecretjwtkey12345';
