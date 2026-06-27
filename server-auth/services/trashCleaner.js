import { File } from '../models/fileModel.js';
import { Directory } from '../models/directoryModel.js';
import { deleteLocalFileIfExists, deleteDirectoryTree, deleteGoogleDriveItemById } from '../services/googleDriveService.js';
import { User } from '../models/userModel.js';

export const cleanExpiredTrash = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const expiredFiles = await File.find({
      isTrashed: true,
      trashedAt: { $lt: thirtyDaysAgo }
    });

    for (const file of expiredFiles) {
      try {
        await deleteLocalFileIfExists(file);
        if (file.googleId) {
          const userData = await User.findById(file.userId).lean();
          if (userData?.googleAccessToken) {
            await deleteGoogleDriveItemById(
              file.googleId,
              userData.googleAccessToken,
              userData.googleRefreshToken,
              file.userId
            );
          }
        }
        await File.deleteOne({ _id: file._id });
      } catch (fileErr) {
        console.error(`Failed to clean expired file ${file._id}:`, fileErr);
      }
    }

    const expiredDirs = await Directory.find({
      isTrashed: true,
      trashedAt: { $lt: thirtyDaysAgo }
    });

    for (const dir of expiredDirs) {
      try {
        await deleteDirectoryTree(dir._id, dir.userId);
      } catch (dirErr) {
        console.error(`Failed to clean expired directory ${dir._id}:`, dirErr);
      }
    }
  } catch (err) {
    console.error('Failed to run expired trash cleanup:', err);
  }
};

export const startTrashCleaner = () => {
  // Run immediately on boot, then once every 24 hours
  cleanExpiredTrash();
  setInterval(cleanExpiredTrash, 24 * 60 * 60 * 1000);
};
