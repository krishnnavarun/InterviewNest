import { rateLimit } from 'express-rate-limit';

const message = (text) => ({ success: false, message: text });

// Brute-force protection for login/register (per IP).
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: message('Too many attempts. Please try again in a few minutes.'),
});

// Burst protection for AI-backed endpoints (per user). Daily cost limits are
// enforced separately in the usage service because in-memory counters reset
// on serverless cold starts.
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  // Always mounted after requireAuth, so the user id is available.
  keyGenerator: (req) => String(req.user._id),
  message: message('You are sending requests too quickly. Please slow down.'),
});
