import { Router } from 'express';
import isLogin from '../middleware/isLogin.js';
import fileUploadMiddleware from '../middleware/fileUpload.js';
import {
  initializeGoogleStorage,
  syncGoogleDriveContents,
  getSyncStatusEndpoint,
  makeFileOffline,
  streamGoogleFile,
  deleteGoogleDriveFile,
  uploadGoogleDriveFile,
  getFileSyncState,
  getGoogleDrivePreferences,
  updateGoogleDrivePreferences,
} from '../controllers/googleDriveController.js';

const googleDriveRouter = Router();

/**
 * POST /google-drive/initialize
 * Initialize Google Drive storage with custom root folder name
 * Body: { rootFolderName: string }
 */
googleDriveRouter.post('/initialize', isLogin, initializeGoogleStorage);

/**
 * POST /google-drive/sync
 * Trigger Google Drive sync
 */
googleDriveRouter.post('/sync', isLogin, syncGoogleDriveContents);

/**
 * GET /google-drive/sync-status
 * Get current sync status
 */
googleDriveRouter.get('/sync-status', isLogin, getSyncStatusEndpoint);

/**
 * GET /google-drive/preferences
 * Get user's Google Drive preferences
 */
googleDriveRouter.get('/preferences', isLogin, getGoogleDrivePreferences);

/**
 * PUT /google-drive/preferences
 * Update user's Google Drive preferences
 * Body: { googleDriveSyncPreference: 'metadata_only' | 'full_file' }
 */
googleDriveRouter.put('/preferences', isLogin, updateGoogleDrivePreferences);

/**
 * POST /google-drive/files/:fileId/make-offline
 * Download file from Google Drive for offline access
 */
googleDriveRouter.post('/files/:fileId/make-offline', isLogin, makeFileOffline);

/**
 * GET /google-drive/files/:fileId/stream
 * Stream file from Google Drive (online viewing)
 */
googleDriveRouter.get('/files/:fileId/stream', isLogin, streamGoogleFile);

/**
 * GET /google-drive/files/:fileId/sync-state
 * Get file's sync state and storage mode
 */
googleDriveRouter.get('/files/:fileId/sync-state', isLogin, getFileSyncState);

/**
 * DELETE /google-drive/files/:fileId
 * Delete file from Google Drive
 * Body: { deleteLocal?: boolean } - whether to delete local copy too
 */
googleDriveRouter.delete('/files/:fileId', isLogin, deleteGoogleDriveFile);

/**
 * POST /google-drive/upload
 * Upload file to Google Drive
 * Body: multipart form with file + parentDirId
 */
googleDriveRouter.post(
  '/upload',
  isLogin,
  fileUploadMiddleware,
  uploadGoogleDriveFile,
);

export default googleDriveRouter;
