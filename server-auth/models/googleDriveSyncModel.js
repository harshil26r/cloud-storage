import { Schema, model } from 'mongoose';

const googleDriveSyncStateSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      unique: true,
    },
    pageToken: { type: String },
    syncStartTime: { type: Date },
    syncEndTime: { type: Date },
    status: {
      type: String,
      enum: ['idle', 'syncing', 'paused', 'error'],
      default: 'idle',
    },
    error: { type: String },
    filesCount: { type: Number, default: 0 },
    foldersCount: { type: Number, default: 0 },
    totalSize: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    strict: 'throw',
  },
);

export const GoogleDriveSyncState = model(
  'GoogleDriveSyncState',
  googleDriveSyncStateSchema,
);
