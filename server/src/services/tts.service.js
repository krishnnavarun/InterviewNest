// Text-to-speech with Murf. Audio is streamed straight to the browser so
// playback can start before the whole file is generated.
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { env } from '../config/env.js';
import { AppError } from '../lib/AppError.js';

const MURF_STREAM_URL = 'https://global.api.murf.ai/v1/speech/stream';

export const isTtsEnabled = () => Boolean(env.MURF_API_KEY);

export async function streamSpeech(text, res) {
  if (!isTtsEnabled()) throw new AppError(503, 'Voice output is not configured.');

  const response = await fetch(MURF_STREAM_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': env.MURF_API_KEY },
    body: JSON.stringify({
      text: text.slice(0, 3000),
      voiceId: env.MURF_VOICE_ID,
      model: 'FALCON',
      multiNativeLocale: 'en-US',
      sampleRate: 24000,
      format: 'MP3',
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => '');
    throw new AppError(502, 'Voice generation failed.', { cause: new Error(`Murf ${response.status}: ${detail}`) });
  }

  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Cache-Control', 'no-store');
  await pipeline(Readable.fromWeb(response.body), res);
}
