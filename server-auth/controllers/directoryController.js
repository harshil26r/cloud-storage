import { Directory } from '../models/directoryModel.js';
import { File } from '../models/fileModel.js';
import {
  deleteDirectoryTree,
  syncGDrivePermissions,
  deleteLocalFileIfExists,
  deleteGoogleDriveItemById,
} from '../services/googleDriveService.js';
import { User } from '../models/userModel.js';
import { hasAccess } from '../middleware/checkAccess.js';
import { createDriveClient, ensureValidToken } from '../services/googleAuth.js';
import { isTrashedRecursive } from '../utils/trashHelper.js';

export const getDirectory = async (req, res) => {
  try {
    const { user } = req;

    const _id = req.params.id ? req.params.id : user.rootDirId;

    if (!_id) {
      return res.status(400).json({ error: 'No directory ID provided' });
    }

    const directoryData = await Directory.findById(_id).lean();

    if (!directoryData) {
      return res
        .status(404)
        .json({ error: 'Directory not found for this user' });
    }

    const allowed = await hasAccess(
      user?._id,
      directoryData,
      'directory',
      'viewer',
    );
    if (!allowed) {
      return res.status(403).json({ error: 'Access Denied' });
    }

    const isTrashed = await isTrashedRecursive(_id, 'directory');
    if (isTrashed) {
      return res.status(403).json({
        error: 'This directory is in the Trash and cannot be accessed.',
      });
    }

    const files = await File.find({
      parentDirId: _id,
      isTrashed: { $ne: true },
    }).lean();
    const directories = await Directory.find({
      parentDirId: _id,
      isTrashed: { $ne: true },
    }).lean();

    res.status(200).json({ ...directoryData, files, directories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createDirectoryCtr = async (req, res) => {
  try {
    const { user } = req;

    const parentDirId = req.params.parentDirId || user.rootDirId;
    const dirName = req.body.dirName?.trim();

    if (!parentDirId) {
      return res.status(400).json({ error: 'No parent directory ID provided' });
    }

    if (!dirName) {
      return res.status(400).json({ error: 'Directory name is required' });
    }

    const parentDir = await Directory.findOne({ _id: parentDirId });

    if (!parentDir) {
      return res.status(404).json({ error: 'Parent directory not found' });
    }

    const isTrashed = await isTrashedRecursive(parentDirId, 'directory');
    if (isTrashed) {
      return res.status(403).json({
        error: 'Cannot modify or create items in a trashed directory.',
      });
    }

    const createdDir = await Directory.create({
      name: dirName,
      userId: user._id,
      parentDirId,
    });

    await createdDir.save();

    res.status(201).json({
      message: 'Directory created successfully',
      id: createdDir._id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const renameDirectory = async (req, res) => {
  try {
    const { user } = req;
    const _id = req.params.id;
    const newName = req.body.newName?.trim();

    if (!_id) {
      return res.status(400).json({ error: 'Directory ID is required' });
    }

    if (!newName) {
      return res.status(400).json({ error: 'New directory name is required' });
    }

    const directoryData = await Directory.findById(_id);

    if (!directoryData) {
      return res
        .status(404)
        .json({ error: 'Directory not found for this user!' });
    }

    const isTrashed = await isTrashedRecursive(_id, 'directory');
    if (isTrashed) {
      return res.status(403).json({
        error: 'Cannot modify or create items in a trashed directory.',
      });
    }

    const allowed = await hasAccess(
      user?._id,
      directoryData,
      'directory',
      'editor',
    );
    if (!allowed) {
      return res.status(403).json({ error: 'Access Denied' });
    }

    await Directory.updateOne({ _id }, { $set: { name: newName } });

    res.status(200).json({ message: 'Directory renamed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteDirectory = async (req, res) => {
  try {
    const { user } = req;
    const _id = req.params.id;

    if (!_id) {
      return res.status(400).json({ error: 'Directory ID is required' });
    }

    const directoryData = await Directory.findById(_id).lean();
    if (!directoryData) {
      return res.status(404).json({ error: 'Directory not found' });
    }

    if (directoryData.userId?.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Access Denied' });
    }

    const stats = await deleteDirectoryTree(_id, user._id);

    res.status(200).json({
      message: 'Directory deleted successfully',
      ...stats,
    });
  } catch (err) {
    console.error('Delete directory error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getShareSettings = async (req, res) => {
  try {
    const dir = await Directory.findById(req.params.id).lean();
    if (!dir) return res.status(404).json({ error: 'Directory not found' });

    // Validate read access (at least viewer)
    const allowed = await hasAccess(req.user?._id, dir, 'directory', 'viewer');
    if (!allowed) {
      return res
        .status(403)
        .json({ error: 'You do not have permission to view share settings' });
    }

    let owner = null;
    if (dir.userId) {
      const ownerUser = await User.findById(dir.userId).lean();
      if (ownerUser) {
        owner = {
          name: ownerUser.username,
          email: ownerUser.email,
        };
      }
    }

    res.status(200).json({
      sharedWith: dir.sharedWith || [],
      generalAccess: dir.generalAccess || 'restricted',
      settings: dir.settings || { allowEditorShare: true },
      googleId: dir.googleId,
      owner,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateShareSettings = async (req, res) => {
  try {
    const { sharedWith = [], generalAccess, settings } = req.body;
    const dir = await Directory.findById(req.params.id);
    if (!dir) return res.status(404).json({ error: 'Directory not found' });

    const isTrashed = await isTrashedRecursive(req.params.id, 'directory');
    if (isTrashed) {
      return res.status(403).json({
        error: 'Cannot modify or create items in a trashed directory.',
      });
    }

    // Validate modification access
    const isOwner =
      dir.userId &&
      req.user?._id &&
      dir.userId.toString() === req.user._id.toString();
    if (!isOwner) {
      const isEditor = await hasAccess(
        req.user?._id,
        dir,
        'directory',
        'editor',
      );
      const allowEditorShare = dir.settings?.allowEditorShare ?? true;
      if (!isEditor || !allowEditorShare) {
        return res.status(403).json({
          error: 'You do not have permission to modify share settings',
        });
      }
    }

    dir.sharedWith = sharedWith;
    dir.generalAccess = generalAccess;
    if (settings) dir.settings = settings;
    await dir.save();

    if (dir.googleId && dir.googleId !== 'root') {
      const userData = await User.findById(req.user._id).lean();
      if (userData?.googleAccessToken) {
        await syncGDrivePermissions(
          dir.googleId,
          userData.googleAccessToken,
          userData.googleRefreshToken,
          req.user._id,
          sharedWith,
          generalAccess,
        );
      }
    }

    res.status(200).json({ message: 'Share settings updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSharedWithMe = async (req, res) => {
  try {
    const userId = req.user._id;
    // Find directories shared with this user, where user is not the creator
    const directories = await Directory.find({
      'sharedWith.userId': userId,
      userId: { $ne: userId },
    }).lean();

    // Find files shared with this user, where user is not the creator
    const files = await File.find({
      'sharedWith.userId': userId,
      userId: { $ne: userId },
    }).lean();

    res.status(200).json({ directories, files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const trashDirectory = async (req, res) => {
  try {
    const dir = await Directory.findById(req.params.id);
    if (!dir) return res.status(404).json({ error: 'Directory not found' });

    const isOwner =
      dir.userId &&
      req.user?._id &&
      dir.userId.toString() === req.user._id.toString();
    if (!isOwner) {
      return res.status(403).json({
        error:
          'Only the owner can trash, restore, or permanently delete this folder.',
      });
    }

    const allowed = await hasAccess(req.user?._id, dir, 'directory', 'editor');
    if (!allowed) return res.status(403).json({ error: 'Access Denied' });

    dir.isTrashed = true;
    dir.trashedAt = new Date();
    await dir.save();

    if (dir.googleId && dir.googleId !== 'root') {
      const userData = await User.findById(req.user._id).lean();
      if (userData?.googleAccessToken) {
        const { accessToken: validToken } = await ensureValidToken(
          userData.googleAccessToken,
          userData.googleRefreshToken,
          req.user._id,
        );
        const drive = createDriveClient(
          validToken,
          userData.googleRefreshToken,
        );
        await drive.files.update({
          fileId: dir.googleId,
          resource: { trashed: true },
        });
      }
    }

    res.status(200).json({ message: 'Folder moved to Trash' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const restoreDirectory = async (req, res) => {
  try {
    const dir = await Directory.findById(req.params.id);
    if (!dir) return res.status(404).json({ error: 'Directory not found' });

    const isOwner =
      dir.userId &&
      req.user?._id &&
      dir.userId.toString() === req.user._id.toString();
    if (!isOwner) {
      return res.status(403).json({
        error:
          'Only the owner can trash, restore, or permanently delete this folder.',
      });
    }

    const allowed = await hasAccess(req.user?._id, dir, 'directory', 'editor');
    if (!allowed) return res.status(403).json({ error: 'Access Denied' });

    dir.isTrashed = false;
    dir.trashedAt = null;
    await dir.save();

    if (dir.googleId && dir.googleId !== 'root') {
      const userData = await User.findById(req.user._id).lean();
      if (userData?.googleAccessToken) {
        const { accessToken: validToken } = await ensureValidToken(
          userData.googleAccessToken,
          userData.googleRefreshToken,
          req.user._id,
        );
        const drive = createDriveClient(
          validToken,
          userData.googleRefreshToken,
        );
        await drive.files.update({
          fileId: dir.googleId,
          resource: { trashed: false },
        });
      }
    }

    res.status(200).json({ message: 'Folder restored from Trash' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteDirectoryPermanent = async (req, res) => {
  try {
    const { user } = req;
    const dir = await Directory.findById(req.params.id);
    if (!dir) return res.status(404).json({ error: 'Directory not found' });

    const isOwner =
      dir.userId && user?._id && dir.userId.toString() === user._id.toString();
    if (!isOwner) {
      return res.status(403).json({
        error:
          'Only the owner can trash, restore, or permanently delete this folder.',
      });
    }

    const allowed = await hasAccess(user?._id, dir, 'directory', 'editor');
    if (!allowed) return res.status(403).json({ error: 'Access Denied' });

    // Recursively deletes tree from disk and DB
    const stats = await deleteDirectoryTree(dir._id, user._id);
    res.status(200).json({ message: 'Folder permanently deleted', ...stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getTrashBin = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch all directly trashed items (isTrashed is true)
    const trashedDirs = await Directory.find({
      userId,
      isTrashed: true,
    }).lean();
    const trashedFiles = await File.find({ userId, isTrashed: true }).lean();

    // Google Drive logic to exclude child items from list (only show top level trashed items)
    const topLevelDirs = [];
    for (const dir of trashedDirs) {
      const parentIsTrashed = await isTrashedRecursive(
        dir.parentDirId,
        'directory',
      );
      if (!parentIsTrashed) topLevelDirs.push(dir);
    }

    const topLevelFiles = [];
    for (const file of trashedFiles) {
      const parentIsTrashed = await isTrashedRecursive(
        file.parentDirId,
        'directory',
      );
      if (!parentIsTrashed) topLevelFiles.push(file);
    }

    res.status(200).json({ directories: topLevelDirs, files: topLevelFiles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const emptyTrash = async (req, res) => {
  try {
    const userId = req.user._id;

    // Permanently delete directly trashed files
    const trashedFiles = await File.find({ userId, isTrashed: true });
    for (const file of trashedFiles) {
      try {
        if (file.googleId) {
          const userData = await User.findById(userId).lean();
          if (userData?.googleAccessToken) {
            await deleteGoogleDriveItemById(
              file.googleId,
              userData.googleAccessToken,
              userData.googleRefreshToken,
              userId,
            );
          }
        }
        await deleteLocalFileIfExists(file);
        await File.deleteOne({ _id: file._id });
      } catch (err) {
        console.error(`Failed to delete file ${file._id}:`, err);
      }
    }

    // Permanently delete directly trashed directories
    const trashedDirs = await Directory.find({ userId, isTrashed: true });
    for (const dir of trashedDirs) {
      try {
        await deleteDirectoryTree(dir._id, userId);
      } catch (err) {
        if (err.message !== 'Directory not found') {
          throw err;
        }
      }
    }

    res.status(200).json({ message: 'Trash bin emptied' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const toggleStarDirectory = async (req, res) => {
  try {
    const { user } = req;
    const _id = req.params.id;

    if (!_id) {
      return res.status(400).json({ error: 'Directory ID is required' });
    }

    const directoryData = await Directory.findById(_id);

    if (!directoryData) {
      return res.status(404).json({ error: 'Directory not found' });
    }

    const allowed = await hasAccess(
      user?._id,
      directoryData,
      'directory',
      'viewer',
    );
    if (!allowed) {
      return res.status(403).json({ error: 'Access Denied' });
    }

    const isStarred = !directoryData.isStarred;
    directoryData.isStarred = isStarred;
    await directoryData.save();

    res.status(200).json({
      message: `Directory ${isStarred ? 'starred' : 'unstarred'} successfully`,
      isStarred,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getStarredItems = async (req, res) => {
  try {
    const userId = req.user._id;

    const directories = await Directory.find({
      isStarred: true,
      isTrashed: { $ne: true },
      $or: [{ userId: userId }, { 'sharedWith.userId': userId }],
    }).lean();

    const files = await File.find({
      isStarred: true,
      isTrashed: { $ne: true },
      $or: [{ userId: userId }, { 'sharedWith.userId': userId }],
    }).lean();

    res.status(200).json({ directories, files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
