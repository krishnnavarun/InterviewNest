// AI cost guardrails and observability.
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import AiUsage from '../models/AiUsage.js';
import Interview from '../models/Interview.js';
import { AppError } from '../lib/AppError.js';

export const today = () => new Date().toISOString().slice(0, 10);

/**
 * Listener registered with the Gemini wrapper: persists token usage per user/day
 * and per interview. Runs fire-and-forget so it never slows down a request.
 */
export async function recordAiCall(meta) {
  const tag = `${meta.ok ? 'ok' : 'fail'} ${meta.feature} ${meta.latencyMs}ms in:${meta.promptTokens ?? 0} out:${meta.outputTokens ?? 0}${
    meta.thoughtsTokens ? ` think:${meta.thoughtsTokens}` : ''
  }${meta.attempt > 1 ? ` attempt:${meta.attempt}` : ''}`;
  console.log(`[ai] ${tag}`);

  if (mongoose.connection.readyState !== 1) return;
  const outputTokens = (meta.outputTokens ?? 0) + (meta.thoughtsTokens ?? 0);

  const writes = [];
  if (meta.userId) {
    writes.push(
      AiUsage.updateOne(
        { userId: meta.userId, day: today() },
        {
          $inc: {
            calls: 1,
            failedCalls: meta.ok ? 0 : 1,
            promptTokens: meta.promptTokens ?? 0,
            outputTokens,
            [`byFeature.${meta.feature}`]: 1,
          },
        },
        { upsert: true }
      )
    );
  }
  if (meta.interviewId) {
    writes.push(
      Interview.updateOne(
        { _id: meta.interviewId },
        {
          $inc: {
            'aiStats.calls': 1,
            'aiStats.promptTokens': meta.promptTokens ?? 0,
            'aiStats.outputTokens': outputTokens,
            'aiStats.latencyMs': meta.latencyMs ?? 0,
          },
        }
      )
    );
  }
  await Promise.all(writes);
}

/** Throws 429 when the user exceeded today's AI budget. */
export async function assertWithinQuota(userId, { startingInterview = false } = {}) {
  const usage = await AiUsage.findOne({ userId, day: today() }).lean();
  if (usage && usage.calls >= env.DAILY_AI_CALL_LIMIT) {
    throw new AppError(429, "You've reached today's AI usage limit. It resets at midnight UTC.");
  }
  if (startingInterview && usage && usage.interviewsStarted >= env.DAILY_INTERVIEW_LIMIT) {
    throw new AppError(429, `You can start up to ${env.DAILY_INTERVIEW_LIMIT} interviews per day. Come back tomorrow!`);
  }
}

export async function countInterviewStart(userId) {
  await AiUsage.updateOne({ userId, day: today() }, { $inc: { interviewsStarted: 1 } }, { upsert: true });
}

export async function getUsageToday(userId) {
  const usage = await AiUsage.findOne({ userId, day: today() }).lean();
  return {
    interviewsStarted: usage?.interviewsStarted ?? 0,
    interviewLimit: env.DAILY_INTERVIEW_LIMIT,
    aiCalls: usage?.calls ?? 0,
    aiCallLimit: env.DAILY_AI_CALL_LIMIT,
    tokens: (usage?.promptTokens ?? 0) + (usage?.outputTokens ?? 0),
  };
}
