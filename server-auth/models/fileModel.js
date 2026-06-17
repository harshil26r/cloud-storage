import { Schema, model } from 'mongoose';

const fileSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      minLength: 3,
    },
    extension: { type: String, trim: true },
    parentDirId: { type: Schema.Types.ObjectId, index: true },
    userId: { type: Schema.Types.ObjectId, index: true },
    // Google Drive fields
    googleId: { type: String },
    mimeType: { type: String },
    size: { type: Number },
    webViewLink: { type: String },
    storageMode: {
      type: String,
      enum: ['local', 'metadata_only', 'offline'],
      default: 'local',
    },
    syncState: {
      type: String,
      enum: ['online_only', 'downloading', 'offline'],
      default: 'offline',
    },
    owners: [{ type: String }],
    shared: { type: Boolean, default: false },
    modifiedAt: { type: Date },
    downloadProgress: { type: Number, default: 0 },
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
      allowDownload: { type: Boolean, default: true },
    },
    isTrashed: { type: Boolean, default: false, index: true },
    trashedAt: { type: Date, default: null },
    isStarred: { type: Boolean, default: false, index: true },
    lastAccessedAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
    strict: 'throw',
  },
);

fileSchema.index({ parentDirId: 1, isTrashed: 1 });
fileSchema.index({ userId: 1, isTrashed: 1 });

export const File = model('File', fileSchema);
