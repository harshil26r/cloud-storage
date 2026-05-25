import bcrypt from 'bcrypt';
import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    username: {
      type: String,
      trim: true,
      minLength: 3,
    },
    email: { type: String, lowercase: true, trim: true, required: true },
    password: { type: String, required: true, minLength: 3 },
    rootDirId: { type: Schema.Types.ObjectId },
  },
  {
    timestamps: true,
    strict: 'throw',
  },
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model('User', userSchema);
