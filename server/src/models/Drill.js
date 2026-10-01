import mongoose from 'mongoose';

const { Mixed, ObjectId } = mongoose.Schema.Types;

// A single targeted practice question with instant, rubric-based feedback.
const drillSchema = new mongoose.Schema(
  {
    userId: { type: ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, required: true },
    roleTitle: { type: String, required: true },
    dimension: String, // skill dimension targeted, if any
    topicTitle: String,
    kind: String,
    question: { type: String, required: true },
    whyThisDrill: String,
    rubric: { type: [Mixed], default: [] },
    answer: String,
    feedback: Mixed, // { evaluation, strengths, improvements, strongAnswerOutline }
    score: Number,
    status: { type: String, enum: ['open', 'answered'], default: 'open' },
    answeredAt: Date,
  },
  { timestamps: true }
);

drillSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Drill', drillSchema, 'practice_drills');
