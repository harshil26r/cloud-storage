import fs from 'fs';
import path from 'path';
import { File } from '../models/fileModel.js';

export const migrateMissingFileSizes = async () => {
  try {
    // 1. Migrate missing sizes
    const filesWithNoSize = await File.find({ size: { $exists: false } });
    if (filesWithNoSize.length > 0) {
      console.log(
        `[Migration] Found ${filesWithNoSize.length} files with missing size. Starting migration...`,
      );
      for (const file of filesWithNoSize) {
        const filePath = path.join(
          process.cwd(),
          'storage',
          `${file._id.toString()}${file.extension || ''}`,
        );
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          file.size = stats.size;
          if (!file.storageMode) {
            file.storageMode = file.googleId ? 'offline' : 'local';
          }
          await file.save();
          console.log(
            `[Migration] Set size for ${file.name} to ${stats.size} bytes`,
          );
        } else {
          file.size = 0;
          if (!file.storageMode) {
            file.storageMode = file.googleId ? 'metadata_only' : 'local';
          }
          await file.save();
          console.log(
            `[Migration] File ${file.name} not found on disk, defaulted size to 0`,
          );
        }
      }
    }

    // 2. Migrate missing storageMode for existing files
    const filesWithNoMode = await File.find({
      storageMode: { $exists: false },
    });
    if (filesWithNoMode.length > 0) {
      console.log(
        `[Migration] Found ${filesWithNoMode.length} files with missing storageMode. Starting migration...`,
      );
      for (const file of filesWithNoMode) {
        const filePath = path.join(
          process.cwd(),
          'storage',
          `${file._id.toString()}${file.extension || ''}`,
        );
        if (fs.existsSync(filePath)) {
          file.storageMode = file.googleId ? 'offline' : 'local';
        } else {
          file.storageMode = file.googleId ? 'metadata_only' : 'local';
        }
        await file.save();
        console.log(
          `[Migration] Set storageMode for ${file.name} to ${file.storageMode}`,
        );
      }
    }
  } catch (err) {
    console.error('[Migration] Error migrating missing attributes:', err);
  }
};
