import { assertServerEnv, env } from './src/config/env.js';
import { connectDB } from './src/config/db.js';
import app from './src/app.js';

assertServerEnv();

// Open the database connection at startup so the first user request does not
// pay for the Atlas handshake. Requests still retry through connectDB() if this fails.
connectDB().catch((error) => console.error(`[db] initial connection failed: ${error.message}`));

// On Vercel the exported app is invoked as a serverless function; locally we listen.
if (!process.env.VERCEL) {
  app.listen(env.PORT, () => {
    console.log(`InterviewNest API listening on http://localhost:${env.PORT} (model: ${env.GEMINI_MODEL})`);
  });
}

export default app;
