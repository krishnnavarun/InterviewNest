import { assertServerEnv, env } from './src/config/env.js';
import app from './src/app.js';

assertServerEnv();

// On Vercel the exported app is invoked as a serverless function; locally we listen.
if (!process.env.VERCEL) {
  app.listen(env.PORT, () => {
    console.log(`InterviewNest API listening on http://localhost:${env.PORT} (model: ${env.GEMINI_MODEL})`);
  });
}

export default app;
