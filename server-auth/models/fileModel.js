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
    userId: { type: Schema.Types.ObjectId },
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
  },
  {
    timestamps: true,
    strict: 'throw',
  },
);

export const File = model('File', fileSchema);
