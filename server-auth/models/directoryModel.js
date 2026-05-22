import { Schema, model } from 'mongoose';

const directorySchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      minLength: 3,
    },
    userId: { type: Schema.Types.ObjectId },
    parentDirId: { type: Schema.Types.ObjectId },
  },
  {
    timestamps: true,
    strict: 'throw',
    collection: 'directories',
  },
);

export const Directory = model('Directory', directorySchema);
