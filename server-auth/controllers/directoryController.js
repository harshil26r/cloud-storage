import { Directory } from '../models/directoryModel.js';
import { File } from '../models/fileModel.js';
import {
  deleteDirectoryTree,
  syncGDrivePermissions,
} from '../services/googleDriveService.js';
import { User } from '../models/userModel.js';
import { hasAccess } from '../middleware/checkAccess.js';

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

    const files = await File.find({ parentDirId: _id }).lean();
    const directories = await Directory.find({ parentDirId: _id }).lean();

    res.status(200).json({ ...directoryData, files, directories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createDirectoryCtr = async (req, res) => {
  try {
    const { user } = req;

    const parentDirId = req.params.parentDirId;
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
