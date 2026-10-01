import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Absent for accounts created with Google sign-in.
    password: { type: String, select: false },
    authProvider: { type: String, enum: ['password', 'google'], default: 'password' },
    googleId: { type: String, index: true, sparse: true },
    lastLoginAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.methods.toPublic = function toPublic() {
  return { id: this._id, name: this.name, email: this.email, createdAt: this.createdAt };
};

export default mongoose.model('User', userSchema);
