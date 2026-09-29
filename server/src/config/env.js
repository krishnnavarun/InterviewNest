// Central, validated access to environment variables.
// Every other module reads config from here instead of process.env.
import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(5000),

  MONGODB_URI: z.string().optional(),
  MONGODB_DB_NAME: z.string().default('interviewnest'),
  JWT_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),

  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-3.8-flash'),
  // Tried in order when the primary model is overloaded or failing
  GEMINI_FALLBACK_MODELS: z.string().default('gemini-3.1-flash-lite,gemini-3.7-flash,gemini-3.5-flash-lite,gemini-3.5-flash'),

  ASSEMBLYAI_API_KEY: z.string().optional(),
  // Priority list of AssemblyAI speech models, comma separated
  ASSEMBLYAI_SPEECH_MODELS: z.string().default('universal-2'),

  GOOGLE_CLIENT_ID: z.string().optional(),

  MURF_API_KEY: z.string().optional(),
  MURF_VOICE_ID: z.string().default('en-US-natalie'),

  CLIENT_ORIGINS: z
    .string()
    .default('http://localhost:5173,https://interview-nest-two.vercel.app'),

  // Cost guardrails (per user, per UTC day)
  DAILY_INTERVIEW_LIMIT: z.coerce.number().int().positive().default(10),
  DAILY_AI_CALL_LIMIT: z.coerce.number().int().positive().default(400),
});

export const env = EnvSchema.parse(process.env);

export const clientOrigins = env.CLIENT_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Called once by server.js so a misconfigured deploy fails loudly at boot
// instead of on the first request.
export function assertServerEnv() {
  const required = ['MONGODB_URI', 'JWT_SECRET', 'GEMINI_API_KEY'];
  const missing = required.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  for (const key of ['ASSEMBLYAI_API_KEY', 'MURF_API_KEY']) {
    if (!env[key]) console.warn(`[env] ${key} is not set - that feature will be disabled.`);
  }
}
