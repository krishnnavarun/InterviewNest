import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { aiLimiter, authLimiter } from '../middleware/rateLimit.js';
import { uploadAnswerAudio, uploadResume } from '../middleware/upload.js';
import * as auth from '../controllers/auth.controller.js';
import * as resume from '../controllers/resume.controller.js';
import * as interview from '../controllers/interview.controller.js';
import * as progress from '../controllers/progress.controller.js';
import * as practice from '../controllers/practice.controller.js';

const router = Router();

// Auth
router.post('/auth/register', authLimiter, validate(auth.RegisterBody), auth.register);
router.post('/auth/login', authLimiter, validate(auth.LoginBody), auth.login);
router.post('/auth/google', authLimiter, validate(auth.GoogleBody), auth.google);
router.get('/auth/me', requireAuth, auth.me);

// Resume + job description analysis
router.get('/resume', requireAuth, resume.getResume);
router.post('/resume', requireAuth, aiLimiter, uploadResume, resume.uploadResume);
router.post('/resume/gap', requireAuth, aiLimiter, validate(resume.GapBody), resume.analyzeGap);

// Interviews
router.get('/interviews', requireAuth, interview.list);
router.post('/interviews', requireAuth, aiLimiter, validate(interview.StartBody), interview.start);
router.get('/interviews/:id', requireAuth, interview.get);
router.post('/interviews/:id/prepare-coding', requireAuth, aiLimiter, interview.prepareCoding);
router.post('/interviews/:id/answer', requireAuth, aiLimiter, uploadAnswerAudio, interview.answer);
router.post('/interviews/:id/code', requireAuth, aiLimiter, validate(interview.CodeBody), interview.submitCode);
router.post('/interviews/:id/finish', requireAuth, aiLimiter, interview.finish);
router.post('/interviews/:id/speech', requireAuth, aiLimiter, validate(interview.SpeechBody), interview.speech);
router.delete('/interviews/:id', requireAuth, interview.remove);

// AI coaching: per-answer coach, practice drills, RAG career coach
router.post('/interviews/:id/topics/:topicId/coach', requireAuth, aiLimiter, practice.topicCoach);
router.get('/drills', requireAuth, practice.listDrills);
router.post('/drills', requireAuth, aiLimiter, validate(practice.DrillBody), practice.createDrill);
router.get('/drills/:id', requireAuth, practice.getDrill);
router.post('/drills/:id/answer', requireAuth, aiLimiter, validate(practice.DrillAnswerBody), practice.answerDrill);
router.post('/coach/ask', requireAuth, aiLimiter, validate(practice.CoachBody), practice.coach);

// Progress dashboard
router.get('/progress', requireAuth, progress.progress);

export default router;
