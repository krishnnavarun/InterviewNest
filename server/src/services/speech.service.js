// Speech-to-text with AssemblyAI, plus word timestamps for speech analytics.
import { AssemblyAI } from 'assemblyai';
import { env } from '../config/env.js';
import { AppError } from '../lib/AppError.js';

let client = null;
const getClient = () => {
  if (!env.ASSEMBLYAI_API_KEY) throw new AppError(503, 'Voice answers are not configured. Please type your answer.');
  client ??= new AssemblyAI({ apiKey: env.ASSEMBLYAI_API_KEY });
  return client;
};

/**
 * Transcribe one recorded answer.
 * @param {Buffer} audio
 * @param {string[]} vocabulary  technical terms from the candidate's resume, boosted
 *                               so words like "Kubernetes" or "Redux" are recognised.
 */
export async function transcribeAnswer(audio, vocabulary = []) {
  const base = {
    audio,
    speech_models: env.ASSEMBLYAI_SPEECH_MODELS.split(',').map((model) => model.trim()),
    language_code: 'en',
    punctuate: true,
    format_text: true,
    disfluencies: true, // keep "um"/"uh" so we can measure filler words
  };
  const wordBoost = [...new Set(vocabulary)]
    .filter((term) => term && term.split(' ').length <= 6)
    .slice(0, 100);

  const transcribe = (params) => getClient().transcripts.transcribe(params);

  let transcript;
  try {
    if (wordBoost.length) {
      // Some speech models reject custom vocabulary; fall back to a plain request.
      transcript = await transcribe({ ...base, word_boost: wordBoost, boost_param: 'default' }).catch((error) => {
        if (error instanceof AppError) throw error;
        return { status: 'error', error: error.message };
      });
      if (transcript.status === 'error') transcript = await transcribe(base);
    } else {
      transcript = await transcribe(base);
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(502, 'Speech-to-text is unavailable right now. Please type your answer.', { cause: error });
  }

  if (transcript.status === 'error') {
    throw new AppError(502, 'We could not transcribe that recording. Please try again or type your answer.', {
      cause: new Error(transcript.error),
    });
  }

  return {
    text: (transcript.text ?? '').trim(),
    words: (transcript.words ?? []).map(({ text, start, end }) => ({ text, start, end })),
  };
}
