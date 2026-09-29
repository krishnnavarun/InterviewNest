import mongoose from 'mongoose';

// Per-user, per-day AI usage counters. Used for cost guardrails (daily quotas)
// and to show usage on the dashboard.
const aiUsageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    day: { type: String, required: true }, // YYYY-MM-DD (UTC)
    calls: { type: Number, default: 0 },
    failedCalls: { type: Number, default: 0 },
    promptTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    interviewsStarted: { type: Number, default: 0 },
    byFeature: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

aiUsageSchema.index({ userId: 1, day: 1 }, { unique: true });

export default mongoose.model('AiUsage', aiUsageSchema);
