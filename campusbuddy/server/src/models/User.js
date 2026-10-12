import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    department: { type: String, default: '', trim: true, maxlength: 120 },
    level: { type: String, default: '', trim: true, maxlength: 20 },
    role: { type: String, enum: ['student', 'staff', 'admin'], default: 'student' },
    // Set whenever the password changes, so older login tokens stop working
    passwordChangedAt: { type: Date },
    // Password reset: only a hash of the token is stored, never the token itself
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
    if (!this.isNew) this.passwordChangedAt = new Date();
  }
});

userSchema.methods.verifyPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    delete ret.resetTokenHash;
    delete ret.resetTokenExpires;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
