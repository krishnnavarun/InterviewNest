import { z } from 'zod';
import { DIMENSION_IDS, ROLE_IDS } from '../config/interview.constants.js';
import { coachTopic } from '../services/answerCoach.service.js';
import * as drills from '../services/drill.service.js';
import { askCoach } from '../services/careerCoach.service.js';

export const DrillBody = z.object({
  role: z.enum(ROLE_IDS).optional(),
  dimension: z.enum(DIMENSION_IDS).optional(),
  focus: z.string().trim().max(300).optional(),
});

export const DrillAnswerBody = z.object({ text: z.string().trim().min(10, 'Write at least a sentence').max(5000) });

export const CoachBody = z.object({
  question: z.string().trim().min(3).max(1000),
  history: z
    .array(z.object({ role: z.enum(['user', 'coach']), content: z.string().max(4000) }))
    .max(12)
    .default([]),
});

export async function topicCoach(req, res) {
  res.json({ success: true, data: await coachTopic(req.user._id, req.params.id, req.params.topicId) });
}

export async function listDrills(req, res) {
  res.json({ success: true, data: await drills.listDrills(req.user._id) });
}

export async function createDrill(req, res) {
  res.status(201).json({ success: true, data: await drills.createDrill(req.user._id, req.body) });
}

export async function getDrill(req, res) {
  res.json({ success: true, data: await drills.getDrill(req.user._id, req.params.id) });
}

export async function answerDrill(req, res) {
  res.json({ success: true, data: await drills.answerDrill(req.user._id, req.params.id, req.body.text) });
}

export async function coach(req, res) {
  res.json({ success: true, data: await askCoach(req.user._id, req.body) });
}
