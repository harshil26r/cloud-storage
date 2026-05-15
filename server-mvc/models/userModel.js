import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    username: {
      type: String,
      trim: true,
      minLength: 3,
    },
    email: { type: String, lowercase: true, trim: true },
    password: { type: String, minLength: 3 },
    rootDirId: { type: Schema.Types.ObjectId },
  },
  {
    timestamps: true,
    strict: 'throw',
  },
);

export const User = model('User', userSchema);
