import {
  syncGoogleDrive,
  downloadFileOffline,
  getGoogleFileStream,
  getSyncStatus,
  deleteGoogleFile,
  uploadToGoogleDrive,
  initializeGoogleDriveStorage,
  verifyFileOwnership,
} from '../services/googleDriveService.js';
import { User } from '../models/userModel.js';

const getUserTokens = async (userId) => {
  const userData = await User.findById(userId).lean();
  if (!userData?.googleAccessToken) {
    return null;
  }
  return userData;
};

/**
 * Initialize Google Drive storage for user
 */
export const initializeGoogleStorage = async (req, res) => {
  try {
    const { user } = req;
    const { rootFolderName } = req.body;

    if (!rootFolderName || rootFolderName.trim().length === 0) {
      return res.status(400).json({ error: 'Root folder name is required' });
    }

    const result = await initializeGoogleDriveStorage(
      user._id,
      rootFolderName.trim(),
    );

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Sync Google Drive contents
 */
export const syncGoogleDriveContents = async (req, res) => {
  try {
    const { user } = req;
    const userData = await getUserTokens(user._id);

    if (!userData) {
      return res.status(400).json({ error: 'Google Drive not connected' });
    }

    const result = await syncGoogleDrive(
      user._id,
      userData.googleAccessToken,
      userData.googleRefreshToken,
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get sync status for user
 */
export const getSyncStatusEndpoint = async (req, res) => {
  try {
    const status = await getSyncStatus(req.user._id);
    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Download file from Google Drive for offline access
 */
export const makeFileOffline = async (req, res) => {
  try {
    const { user } = req;
    const { fileId } = req.params;

    const file = await verifyFileOwnership(fileId, user._id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!file.googleId) {
      return res.status(400).json({ error: 'File is not from Google Drive' });
    }

    const userData = await getUserTokens(user._id);
    if (!userData) {
      return res.status(400).json({ error: 'Google Drive not connected' });
    }

    if (file.syncState === 'downloading') {
      return res.status(409).json({ error: 'Download already in progress' });
    }

    if (file.syncState === 'offline') {
      return res.status(200).json({
        message: 'File is already available offline',
        fileId,
        syncState: 'offline',
      });
    }

    downloadFileOffline(
      fileId,
      file.googleId,
      userData.googleAccessToken,
      userData.googleRefreshToken,
      user._id,
    ).catch((err) =>
      console.error(`Error downloading file ${fileId}:`, err.message),
    );

    res.status(202).json({
      message: 'Download started',
      fileId,
      syncState: 'downloading',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Stream file from Google Drive for online viewing
 */
export const streamGoogleFile = async (req, res) => {
  try {
    const { user } = req;
    const { fileId } = req.params;

    const file = await verifyFileOwnership(fileId, user._id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!file.googleId) {
      return res.status(400).json({ error: 'File is not from Google Drive' });
    }

    if (file.syncState === 'offline') {
      return res.status(400).json({
        error: 'File is offline. Serve from local storage instead.',
      });
    }

    const userData = await getUserTokens(user._id);
    if (!userData) {
      return res.status(400).json({ error: 'Google Drive not connected' });
    }

    const stream = await getGoogleFileStream(
      file.googleId,
      userData.googleAccessToken,
      userData.googleRefreshToken,
      user._id,
    );

    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${file.name}"`);
    stream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete file from Google Drive
 */
export const deleteGoogleDriveFile = async (req, res) => {
  try {
    const { user } = req;
    const { fileId } = req.params;
    const { deleteLocal } = req.body;

    const file = await verifyFileOwnership(fileId, user._id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!file.googleId) {
      return res.status(400).json({ error: 'File is not from Google Drive' });
    }

    const userData = await getUserTokens(user._id);
    if (!userData) {
      return res.status(400).json({ error: 'Google Drive not connected' });
    }

    const result = await deleteGoogleFile(
      fileId,
      file.googleId,
      userData.googleAccessToken,
      userData.googleRefreshToken,
      deleteLocal || false,
      user._id,
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Upload file to Google Drive
 */
export const uploadGoogleDriveFile = async (req, res) => {
  try {
    const { user } = req;
    const { parentDirId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!parentDirId) {
      return res.status(400).json({ error: 'Parent directory ID is required' });
    }

    const userData = await getUserTokens(user._id);
    if (!userData) {
      return res.status(400).json({ error: 'Google Drive not connected' });
    }

    const filePath = `${process.cwd()}/storage/${req.file._id}${req.file.extension}`;
    const result = await uploadToGoogleDrive(
      user._id,
      req.file._id,
      filePath,
      req.file.originalname,
      parentDirId,
      req.file.mimetype,
      req.file.extension,
      userData.googleAccessToken,
      userData.googleRefreshToken,
    );

    res.status(201).json({
      message: 'File uploaded to Google Drive',
      _id: result.file._id,
      file: result.file,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get file sync state
 */
export const getFileSyncState = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await verifyFileOwnership(fileId, req.user._id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.status(200).json({
      fileId,
      name: file.name,
      syncState: file.syncState,
      storageMode: file.storageMode,
      downloadProgress: file.downloadProgress,
      size: file.size,
      googleId: file.googleId,
      webViewLink: file.webViewLink,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get user's Google Drive preferences
 */
export const getGoogleDrivePreferences = async (req, res) => {
  try {
    const userData = await User.findById(req.user._id).lean();

    res.status(200).json({
      googleId: userData.googleId,
      googleDriveSyncPreference: userData.googleDriveSyncPreference,
      rootGoogleDriveName: userData.rootGoogleDriveName,
      googleDriveRootDirId: userData.googleDriveRootDirId,
      googleDriveConnected: !!userData.googleAccessToken,
      lastSyncTime: userData.lastSyncTime,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update user's Google Drive preferences
 */
export const updateGoogleDrivePreferences = async (req, res) => {
  try {
    const { googleDriveSyncPreference, rootGoogleDriveName } = req.body;

    if (
      googleDriveSyncPreference &&
      !['metadata_only', 'full_file'].includes(googleDriveSyncPreference)
    ) {
      return res.status(400).json({ error: 'Invalid sync preference' });
    }

    const updates = {};
    if (googleDriveSyncPreference) {
      updates.googleDriveSyncPreference = googleDriveSyncPreference;
    }
    if (rootGoogleDriveName?.trim()) {
      updates.rootGoogleDriveName = rootGoogleDriveName.trim();
    }

    const userData = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
    }).lean();

    res.status(200).json({
      message: 'Preferences updated',
      googleDriveSyncPreference: userData.googleDriveSyncPreference,
      rootGoogleDriveName: userData.rootGoogleDriveName,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
