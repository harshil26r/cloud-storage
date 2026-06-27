import { File } from '../models/fileModel.js';
import { Directory } from '../models/directoryModel.js';
import { User } from '../models/userModel.js';
import {
  getGoogleFileStream,
  deleteGoogleFile,
  deleteLocalFileIfExists,
  hasLocalCopy,
  syncGDrivePermissions,
} from '../services/googleDriveService.js';
import { hasAccess } from '../middleware/checkAccess.js';

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
  const { _id, extension, originalname } = req.file;
  const { user } = req;

  try {
    const fileCollection = await File.create({
      _id,
      extension,
      name: originalname,
      parentDirId,
      userId: user?._id,
    });

    fileCollection.save();

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

    const allowed = await hasAccess(user?._id, fileInfo, 'file', 'editor');
    if (!allowed) {
      return res.status(403).json({ error: 'Access Denied' });
    }

    await File.updateOne({ _id }, { $set: { name: newName } });

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
