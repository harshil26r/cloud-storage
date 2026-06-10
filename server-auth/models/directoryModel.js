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
    sharedWith: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        email: { type: String },
        role: { type: String, enum: ['viewer', 'editor'], default: 'viewer' },
      },
    ],
    generalAccess: {
      type: String,
      enum: ['restricted', 'anyone_view'],
      default: 'restricted',
    },
    settings: {
      allowEditorShare: { type: Boolean, default: true },
    },
    isTrashed: { type: Boolean, default: false, index: true },
    trashedAt: { type: Date, default: null },
    isStarred: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    strict: 'throw',
    collection: 'directories',
  },
);

export const Directory = model('Directory', directorySchema);
