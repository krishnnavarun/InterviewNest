import { Router } from 'express';
import { startInterview } from '../controllers/interview.controller.js';
import authenticate from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.post('/start', startInterview);

export default router;