import mongoose from 'mongoose';

// One resume per user: the raw text plus the AI-extracted structured profile.
const resumeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fileName: { type: String, required: true },
    text: { type: String, required: true },
    profile: { type: mongoose.Schema.Types.Mixed, required: true },
    // Cache of the last job-description analysis so starting the interview
    // does not repeat the same LLM call.
    lastGap: {
      key: String,
      result: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Resume', resumeSchema, 'resume_profiles');
