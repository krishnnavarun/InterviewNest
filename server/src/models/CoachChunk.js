import mongoose from 'mongoose';

// Retrieval chunks for the RAG career coach: one per answered topic, coding
// round and report, embedded with Gemini (768 dimensions).
const coachChunkSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview', required: true, index: true },
    kind: { type: String, enum: ['topic', 'coding', 'report'], required: true },
    label: { type: String, required: true }, // human-readable source title
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
    date: Date,
  },
  { timestamps: true }
);

export default mongoose.model('CoachChunk', coachChunkSchema, 'coach_chunks');
