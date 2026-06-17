import mongoose from 'mongoose';
import { File } from '../models/fileModel.js';
import { Directory } from '../models/directoryModel.js';
import { User } from '../models/userModel.js';
import {
  getGoogleFileStream,
  deleteGoogleFile,
  deleteLocalFileIfExists,
  hasLocalCopy,
  syncGDrivePermissions,
  deleteGoogleDriveItemById,
} from '../services/googleDriveService.js';
import { hasAccess } from '../middleware/checkAccess.js';
import { createDriveClient, ensureValidToken } from '../services/googleAuth.js';
import { isTrashedRecursive } from '../utils/trashHelper.js';
import {
  getStorageUsed,
  isStorageExceeded,
  isStorageFull,
} from '../utils/storageHelper.js';

export const serveFile = async (req, res) => {
  try {
    const { user } = req;
    const _id = req.params.id;

    if (!_id) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    const fileInfo = await File.findOne({ _id }).lean();
    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }

    const allowed = await hasAccess(user?._id, fileInfo, 'file', 'viewer');
    if (!allowed) {
      return res.status(403).json({ error: 'Access Denied' });
    }

    const isTrashed = await isTrashedRecursive(_id, 'file');
    if (isTrashed) {
      return res
        .status(403)
        .json({ error: 'This file is in the Trash and cannot be accessed.' });
    }

    // Check storage limit
    if (await isStorageFull(user?._id)) {
      return res
        .status(403)
        .json({ error: 'Storage full. Downloads and uploads are restricted.' });
    }

    // Update lastAccessedAt timestamp asynchronously
    File.updateOne({ _id }, { $set: { lastAccessedAt: new Date() } }).catch(
      (err) => {
        console.error('Failed to update lastAccessedAt:', err);
      },
    );

    const isGoogleOnline =
      fileInfo.googleId &&
      fileInfo.syncState !== 'offline' &&
      fileInfo.storageMode !== 'offline';

    if (isGoogleOnline) {
      const userData = await User.findById(user._id).lean();
      if (!userData?.googleAccessToken) {
        return res.status(400).json({ error: 'Google Drive not connected' });
      }

      const stream = await getGoogleFileStream(
        fileInfo.googleId,
        userData.googleAccessToken,
        userData.googleRefreshToken,
        user._id,
      );

      stream.on('error', (err) => {
        console.error('Google Drive stream error:', err);
        if (!res.headersSent) {
          res.status(502).json({ error: 'Failed to retrieve Google Drive file stream' });
        }
      });

      if (req.query.action === 'download') {
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${fileInfo.name}"`,
        );
      }

      res.setHeader(
        'Content-Type',
        fileInfo.mimeType || 'application/octet-stream',
      );
      return stream.pipe(res);
    }

    if (req.query.action === 'download') {
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileInfo.name}"`,
      );
    }

    res.sendFile(
      `${process.cwd()}/storage/${_id.toString()}${fileInfo.extension || ''}`,
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const uploadFile = async (req, res) => {
  const parentDirId = req.body.parentDirId;
  const { _id, extension, originalname, size, mimetype } = req.file;
  const { user } = req;

  try {
    const isTrashed = await isTrashedRecursive(parentDirId, 'directory');
    if (isTrashed) {
      await deleteLocalFileIfExists({ _id, extension });
      return res
        .status(403)
        .json({ error: 'Cannot upload files to a trashed directory.' });
    }

    // Check storage limit (500 MB)
    if (await isStorageExceeded(user?._id, size || 0)) {
      await deleteLocalFileIfExists({ _id, extension });
      return res
        .status(400)
        .json({ error: 'Storage limit exceeded. Maximum limit is 500 MB.' });
    }

    const fileCollection = await File.create({
      _id,
      extension,
      name: originalname,
      parentDirId,
      userId: user?._id,
      size: size || 0,
      mimeType: mimetype || 'application/octet-stream',
    });

    await fileCollection.save();

    res.status(201).json({ message: 'File uploaded successfully', _id });
  } catch (dbErr) {
    console.error(`Database error for file ${_id}:`, dbErr);
    res.status(500).json({ error: 'Failed to save file metadata' });
  }
};

export const renameFile = async (req, res) => {
  try {
    const { user } = req;

    const _id = req.params.id;
    const newName = req.body.newName?.trim();

    if (!_id) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    if (!newName) {
      return res.status(400).json({ error: 'New filename is required' });
    }

    const fileInfo = await File.findOne({ _id });

    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }

    const isTrashed = await isTrashedRecursive(_id, 'file');
    if (isTrashed) {
      return res
        .status(403)
        .json({ error: 'Cannot modify files that are in the Trash.' });
    }

    const allowed = await hasAccess(user?._id, fileInfo, 'file', 'editor');
    if (!allowed) {
      return res.status(403).json({ error: 'Access Denied' });
    }

    await File.updateOne(
      { _id },
      { $set: { name: newName, lastAccessedAt: new Date() } },
    );

    res.status(200).json({ message: 'File renamed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const { user } = req;
    const _id = req.params.id;

    if (!_id) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    const fileInfo = await File.findOne({ _id }).lean();

    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }

    const allowed = await hasAccess(user?._id, fileInfo, 'file', 'editor');
    if (!allowed) {
      return res.status(403).json({ error: 'Access Denied' });
    }

    if (fileInfo.googleId) {
      const userData = await User.findById(user._id).lean();
      if (!userData?.googleAccessToken) {
        return res.status(400).json({ error: 'Google Drive not connected' });
      }

      const result = await deleteGoogleFile(
        _id,
        fileInfo.googleId,
        userData.googleAccessToken,
        userData.googleRefreshToken,
        hasLocalCopy(fileInfo),
        user._id,
      );

      return res.status(200).json(result);
    }

    await deleteLocalFileIfExists(fileInfo);
    await File.deleteOne({ _id });

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getShareSettings = async (req, res) => {
  try {
    const file = await File.findById(req.params.id).lean();
    if (!file) return res.status(404).json({ error: 'File not found' });

    // Validate read access (at least viewer)
    const allowed = await hasAccess(req.user?._id, file, 'file', 'viewer');
    if (!allowed) {
      return res
        .status(403)
        .json({ error: 'You do not have permission to view share settings' });
    }

    let owner = null;
    if (file.userId) {
      const ownerUser = await User.findById(file.userId).lean();
      if (ownerUser) {
        owner = {
          name: ownerUser.username,
          email: ownerUser.email,
        };
      }
    }

    res.status(200).json({
      sharedWith: file.sharedWith || [],
      generalAccess: file.generalAccess || 'restricted',
      settings: file.settings || { allowEditorShare: true },
      googleId: file.googleId,
      owner,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateShareSettings = async (req, res) => {
  try {
    const { sharedWith = [], generalAccess, settings } = req.body;
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    const isTrashed = await isTrashedRecursive(req.params.id, 'file');
    if (isTrashed) {
      return res
        .status(403)
        .json({ error: 'Cannot modify files that are in the Trash.' });
    }

    // Validate modification access
    const isOwner =
      file.userId &&
      req.user?._id &&
      file.userId.toString() === req.user._id.toString();
    if (!isOwner) {
      const isEditor = await hasAccess(req.user?._id, file, 'file', 'editor');
      const allowEditorShare = file.settings?.allowEditorShare ?? true;
      if (!isEditor || !allowEditorShare) {
        return res.status(403).json({
          error: 'You do not have permission to modify share settings',
        });
      }
    }

    file.sharedWith = sharedWith;
    file.generalAccess = generalAccess;
    if (settings) file.settings = settings;
    await file.save();

    if (file.googleId) {
      const userData = await User.findById(req.user._id).lean();
      if (userData?.googleAccessToken) {
        await syncGDrivePermissions(
          file.googleId,
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

export const trashFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    const isOwner =
      file.userId &&
      req.user?._id &&
      file.userId.toString() === req.user._id.toString();
    if (!isOwner) {
      return res.status(403).json({
        error:
          'Only the owner can trash, restore, or permanently delete this file.',
      });
    }

    const allowed = await hasAccess(req.user?._id, file, 'file', 'editor');
    if (!allowed) return res.status(403).json({ error: 'Access Denied' });

    file.isTrashed = true;
    file.trashedAt = new Date();
    await file.save();

    if (file.googleId) {
      const userData = await User.findById(req.user._id).lean();
      if (userData?.googleAccessToken) {
        // Sync with Google Drive trash setting
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
          fileId: file.googleId,
          resource: { trashed: true },
        });
      }
    }

    res.status(200).json({ message: 'File moved to Trash' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const restoreFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    const isOwner =
      file.userId &&
      req.user?._id &&
      file.userId.toString() === req.user._id.toString();
    if (!isOwner) {
      return res.status(403).json({
        error:
          'Only the owner can trash, restore, or permanently delete this file.',
      });
    }

    const allowed = await hasAccess(req.user?._id, file, 'file', 'editor');
    if (!allowed) return res.status(403).json({ error: 'Access Denied' });

    file.isTrashed = false;
    file.trashedAt = null;
    await file.save();

    if (file.googleId) {
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
          fileId: file.googleId,
          resource: { trashed: false },
        });
      }
    }

    res.status(200).json({ message: 'File restored from Trash' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteFilePermanent = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    const isOwner =
      file.userId &&
      req.user?._id &&
      file.userId.toString() === req.user._id.toString();
    if (!isOwner) {
      return res.status(403).json({
        error:
          'Only the owner can trash, restore, or permanently delete this file.',
      });
    }

    const allowed = await hasAccess(req.user?._id, file, 'file', 'editor');
    if (!allowed) return res.status(403).json({ error: 'Access Denied' });

    if (file.googleId) {
      const userData = await User.findById(req.user._id).lean();
      if (userData?.googleAccessToken) {
        await deleteGoogleDriveItemById(
          file.googleId,
          userData.googleAccessToken,
          userData.googleRefreshToken,
          req.user._id,
        );
      }
    }

    await deleteLocalFileIfExists(file);

    await File.deleteOne({ _id: file._id });
    res.status(200).json({ message: 'File permanently deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const toggleStarFile = async (req, res) => {
  try {
    const { user } = req;
    const _id = req.params.id;

    if (!_id) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    const fileInfo = await File.findById(_id);
    console.log(fileInfo, _id);

    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }

    const allowed = await hasAccess(user?._id, fileInfo, 'file', 'viewer');
    if (!allowed) {
      return res.status(403).json({ error: 'Access Denied' });
    }

    const isStarred = !fileInfo.isStarred;
    fileInfo.isStarred = isStarred;
    await fileInfo.save();

    res.status(200).json({
      message: `File ${isStarred ? 'starred' : 'unstarred'} successfully`,
      isStarred,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getRecentFiles = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch files belonging to or shared with the user, sorted by lastAccessedAt descending
    const files = await File.find({
      isTrashed: { $ne: true },
      $or: [{ userId: userId }, { 'sharedWith.userId': userId }],
    })
      .sort({ lastAccessedAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
