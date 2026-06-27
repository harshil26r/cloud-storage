import { File } from '../models/fileModel.js';
import { Directory } from '../models/directoryModel.js';

/**
 * Recursively checks if an item or any of its parent directories are trashed.
 * @param {string} itemId - The ID of the file or directory.
 * @param {string} itemType - The type of the item, either 'file' or 'directory'.
 * @returns {Promise<boolean>} True if the item or any ancestor is trashed, false otherwise.
 */
export const isTrashedRecursive = async (itemId, itemType) => {
  if (!itemId) return false;

  if (itemType === 'file') {
    const file = await File.findById(itemId).lean();
    if (!file) return false;
    if (file.isTrashed) return true;
    if (file.parentDirId) {
      return await isTrashedRecursive(file.parentDirId, 'directory');
    }
  } else {
    const dir = await Directory.findById(itemId).lean();
    if (!dir) return false;
    if (dir.isTrashed) return true;
    if (dir.parentDirId) {
      return await isTrashedRecursive(dir.parentDirId, 'directory');
    }
  }
  return false;
};
