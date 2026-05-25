import { model, Schema } from 'mongoose';

const sessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 5,
    },
  },
  {
    strict: 'throw',
  },
);

export const Session = model('Session', sessionSchema);
