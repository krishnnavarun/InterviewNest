import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Absent for accounts created with Google sign-in.
    password: { type: String, select: false },
    authProvider: { type: String, enum: ['password', 'google'], default: 'password' },
    googleId: { type: String, index: true, sparse: true },
    profile: {
      headline: { type: String, trim: true, maxlength: 120, default: '' },
      location: { type: String, trim: true, maxlength: 120, default: '' },
      bio: { type: String, trim: true, maxlength: 500, default: '' },
      links: {
        github: { type: String, trim: true, maxlength: 2048, default: '' },
        linkedin: { type: String, trim: true, maxlength: 2048, default: '' },
        leetcode: { type: String, trim: true, maxlength: 2048, default: '' },
        portfolio: { type: String, trim: true, maxlength: 2048, default: '' },
      },
    },
    lastLoginAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    createdAt: this.createdAt,
    profile: this.profile ?? { headline: '', location: '', bio: '', links: {} },
  };
};

export default mongoose.model('User', userSchema);
