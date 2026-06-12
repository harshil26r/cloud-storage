import mongoose from 'mongoose';
import { File } from '../models/fileModel.js';

export const STORAGE_LIMIT = 500 * 1024 * 1024; // 500 MB

/**
 * Calculates total storage used (in bytes) by local and offline files for a user.
 */
export const getStorageUsed = async (userId) => {
  if (!userId) return 0;
  const result = await File.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        storageMode: { $in: ['local', 'offline'] },
      },
    },
    { $group: { _id: null, totalSize: { $sum: '$size' } } },
  ]);
  return result[0]?.totalSize || 0;
};

/**
 * Checks if adding additional bytes would exceed the storage limit.
 */
export const isStorageExceeded = async (userId, additionalBytes = 0) => {
  const currentUsed = await getStorageUsed(userId);
  return currentUsed + additionalBytes > STORAGE_LIMIT;
};

/**
 * Checks if storage is already full.
 */
export const isStorageFull = async (userId) => {
  const currentUsed = await getStorageUsed(userId);
  return currentUsed >= STORAGE_LIMIT;
};
