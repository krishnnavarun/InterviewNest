import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { clientOrigins, env } from './config/env.js';
import { connectDB } from './config/db.js';
import { setUsageListener } from './ai/gemini.js';
import { recordAiCall } from './services/usage.service.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

setUsageListener(recordAiCall);

const app = express();

app.set('trust proxy', 1); // behind Vercel's proxy: use the real client IP for rate limiting
app.use(helmet());
app.use(
  cors({
    origin: clientOrigins,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => {
  res.json({ success: true, message: 'InterviewNest API is running', model: env.GEMINI_MODEL });
});
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    time: new Date().toISOString(),
    // Lets the client adapt its UI to optional integrations.
    features: {
      speechToText: Boolean(env.ASSEMBLYAI_API_KEY),
      textToSpeech: Boolean(env.MURF_API_KEY),
      googleSignIn: Boolean(env.GOOGLE_CLIENT_ID),
    },
  });
});

// Make sure MongoDB is connected before any API route runs (serverless cold starts).
app.use('/api', async (req, res, next) => {
  await connectDB();
  next();
});
app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
