import { Schema, model } from 'mongoose';

const fileSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      minLength: 3,
    },
    extension: { type: String, trim: true },
    parentDirId: { type: Schema.Types.ObjectId },
  },
  {
    timestamps: true,
    strict: 'throw',
    collection: 'directories',
  },
);

export const File = model('File', fileSchema);
