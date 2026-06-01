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
    // Google Drive fields
    googleId: { type: String },
    mimeType: { type: String },
    webViewLink: { type: String },
    storageMode: {
      type: String,
      enum: ['local', 'metadata_only', 'offline'],
      default: 'local',
    },
    owners: [{ type: String }],
    shared: { type: Boolean, default: false },
    modifiedAt: { type: Date },
  },
  {
    timestamps: true,
    strict: 'throw',
    collection: 'directories',
  },
);

export const Directory = model('Directory', directorySchema);
