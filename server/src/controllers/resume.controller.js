import { z } from 'zod';
import { ROLE_IDS, getRole } from '../config/interview.constants.js';
import { AppError } from '../lib/AppError.js';
import * as resumeService from '../services/resume.service.js';
import { analyzeJobDescription } from '../services/planner.service.js';
import { assertWithinQuota } from '../services/usage.service.js';

export const GapBody = z.object({
  role: z.enum(ROLE_IDS),
  jobDescription: z.string().trim().min(80, 'Paste the full job description (at least 80 characters)').max(12000),
});

export async function getResume(req, res) {
  res.json({ success: true, data: await resumeService.getResume(req.user._id) });
}

export async function uploadResume(req, res) {
  if (!req.file) throw new AppError(400, 'Please choose a PDF file to upload.');
  await assertWithinQuota(req.user._id);
  res.json({ success: true, data: await resumeService.analyzeResume(req.user._id, req.file) });
}

export async function analyzeGap(req, res) {
  await assertWithinQuota(req.user._id);
  const resume = await resumeService.requireResume(req.user._id);
  const gap = await analyzeJobDescription({
    resume,
    role: getRole(req.body.role),
    jobDescription: req.body.jobDescription,
    userId: String(req.user._id),
  });
  res.json({ success: true, data: gap });
}
