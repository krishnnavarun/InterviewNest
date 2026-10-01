import { z } from 'zod';
import { CODE_LANGUAGES, DIFFICULTY_IDS, ROLE_IDS } from '../config/interview.constants.js';
import { AppError } from '../lib/AppError.js';
import * as interviewService from '../services/interview.service.js';
import { isTtsEnabled, streamSpeech } from '../services/tts.service.js';

export const StartBody = z.object({
  role: z.enum(ROLE_IDS),
  difficulty: z.enum(DIFFICULTY_IDS),
  jobDescription: z
    .string()
    .trim()
    .max(12000)
    .optional()
    .transform((value) => (value && value.length >= 80 ? value : undefined)),
  focusWeakAreas: z.boolean().default(true),
  voiceEnabled: z.boolean().default(true),
});

export const CodeBody = z.object({
  language: z.enum(CODE_LANGUAGES),
  code: z.string().max(20000),
  outputs: z
    .array(
      z.object({
        actual: z.string().max(20000).nullable().optional(),
        error: z.string().max(2000).nullable().optional(),
      })
    )
    .max(20),
});

export const SpeechBody = z.object({ turnIndex: z.number().int().min(0) });

export const ListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export async function list(req, res) {
  const query = ListQuery.parse(req.query);
  res.json({ success: true, data: await interviewService.listInterviews(req.user._id, query) });
}

export async function start(req, res) {
  res.status(201).json({ success: true, data: await interviewService.startInterview(req.user, req.body) });
}

export async function get(req, res) {
  res.json({ success: true, data: await interviewService.getInterview(req.user._id, req.params.id) });
}

export async function prepareCoding(req, res) {
  res.json({ success: true, data: await interviewService.prepareCoding(req.user._id, req.params.id) });
}

export async function answer(req, res) {
  const data = await interviewService.submitAnswer(req.user, req.params.id, {
    text: req.body?.text,
    audio: req.file ?? null,
  });
  res.json({ success: true, data });
}

export async function submitCode(req, res) {
  res.json({ success: true, data: await interviewService.submitCode(req.user, req.params.id, req.body) });
}

export async function finish(req, res) {
  res.json({ success: true, data: await interviewService.finishInterview(req.user, req.params.id) });
}

export async function speech(req, res) {
  if (!isTtsEnabled()) throw new AppError(503, 'Voice output is not configured.');
  const text = await interviewService.getSpeechText(req.user._id, req.params.id, req.body.turnIndex);
  await streamSpeech(text, res);
}

export async function remove(req, res) {
  await interviewService.deleteInterview(req.user._id, req.params.id);
  res.json({ success: true, data: { deleted: true } });
}
