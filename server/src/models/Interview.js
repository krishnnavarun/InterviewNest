import mongoose from 'mongoose';

const { Mixed, ObjectId } = mongoose.Schema.Types;

const turnSchema = new mongoose.Schema(
  {
    speaker: { type: String, enum: ['interviewer', 'candidate'], required: true },
    topicId: String,
    // Interviewer turns: `text` is the spoken reaction/transition, `question` the question asked.
    text: { type: String, default: '' },
    question: { type: String, default: '' },
    action: String, // follow_up | probe_deeper | give_hint | next_topic | wrap_up | greeting | code_review
    reasoning: String, // why the agent chose this action (shown in the report)
    policyOverride: String, // set when a guardrail replaced the model's proposed action
    // Candidate turns
    inputMode: { type: String, enum: ['voice', 'text', 'code'] },
    speech: Mixed, // speech analytics for voice answers
    evaluation: Mixed, // sanitized, cumulative topic evaluation after this answer
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } }
);

const interviewSchema = new mongoose.Schema(
  {
    userId: { type: ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, required: true },
    roleTitle: { type: String, required: true },
    difficulty: { type: String, required: true },
    difficultyLabel: { type: String, required: true },
    voiceEnabled: { type: Boolean, default: true },

    jobDescription: { type: String, default: '' },
    gap: Mixed,
    weakAreasTargeted: { type: [Mixed], default: [] },

    status: { type: String, enum: ['in_progress', 'completed', 'abandoned'], default: 'in_progress', index: true },
    // conversation: answering questions | coding: solving the coding problem | wrap_up: waiting for report
    phase: { type: String, enum: ['conversation', 'coding', 'wrap_up', 'done'], default: 'conversation' },

    plan: {
      greeting: String,
      topics: { type: [Mixed], default: [] }, // { id, title, kind, openingQuestion, whyThisTopic, rubric[], maxFollowUps }
    },
    turnBudget: Number,
    currentTopicIndex: { type: Number, default: 0 },
    followUpsOnTopic: { type: Number, default: 0 },
    turns: { type: [turnSchema], default: [] },

    coding: {
      status: { type: String, enum: ['none', 'generating', 'ready', 'failed'], default: 'none' },
      startedAt: Date, // when generation was claimed (lets a crashed generation be retried)
      problem: Mixed, // includes referenceSolution - never sent to the client
      verification: Mixed, // { generated, kept, attempts }
      submission: Mixed, // { language, code, results, review, submittedAt }
    },

    report: Mixed,
    overallScore: Number,
    dimensionScores: Mixed,
    aiStats: {
      calls: { type: Number, default: 0 },
      promptTokens: { type: Number, default: 0 },
      outputTokens: { type: Number, default: 0 },
      latencyMs: { type: Number, default: 0 },
    },
    completedAt: Date,
    // Short-lived lock so a double-submitted answer cannot be processed twice.
    busyUntil: { type: Date, default: () => new Date(0) },
  },
  { timestamps: true }
);

interviewSchema.index({ userId: 1, createdAt: -1 });

// v2 lives in its own collection so documents from the old version never collide.
export default mongoose.model('Interview', interviewSchema, 'interview_sessions');
