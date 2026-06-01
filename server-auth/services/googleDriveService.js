import { google } from 'googleapis';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { createDriveClient, ensureValidToken } from './googleAuth.js';
import { User } from '../models/userModel.js';
import { Directory } from '../models/directoryModel.js';
import { File } from '../models/fileModel.js';
import { GoogleDriveSyncState } from '../models/googleDriveSyncModel.js';

const STORAGE_DIR = './storage';

const FILE_FIELDS =
  'id, name, mimeType, parents, modifiedTime, createdTime, size, webViewLink, owners, shared, trashed';

const CHANGE_FIELDS = `nextPageToken, newStartPageToken, changes(removed, file(${FILE_FIELDS}))`;

/**
 * Sync Google Drive contents to app
 * Performs incremental sync using change tracking
 */
export const syncGoogleDrive = async (userId, accessToken, refreshToken) => {
  let syncState;

  try {
    const { accessToken: validToken } = await ensureValidToken(
      accessToken,
      refreshToken,
      userId,
    );

    const drive = createDriveClient(validToken, refreshToken);

    syncState = await GoogleDriveSyncState.findOne({ userId });
    if (!syncState) {
      syncState = await GoogleDriveSyncState.create({ userId });
    }

    syncState.status = 'syncing';
    syncState.syncStartTime = new Date();
    syncState.error = undefined;
    await syncState.save();

    const user = await User.findById(userId);

    if (!user.googleDriveRootDirId) {
      const rootDir = await Directory.create({
        name: user.rootGoogleDriveName || 'Google Drive',
        userId,
        parentDirId: user.rootDirId,
        googleId: 'root',
        storageMode: 'metadata_only',
        mimeType: 'application/vnd.google-apps.folder',
      });

      user.googleDriveRootDirId = rootDir._id;
      await user.save();
    }

    let changesProcessed = 0;

    if (!syncState.pageToken) {
      changesProcessed = await performInitialSync(
        drive,
        userId,
        user.googleDriveRootDirId,
        user.googleDriveSyncPreference,
        validToken,
        refreshToken,
      );

      const startTokenRes = await drive.changes.getStartPageToken({
        spaces: 'drive',
      });
      syncState.pageToken = startTokenRes.data.startPageToken;
    } else {
      changesProcessed = await performIncrementalSync(
        drive,
        syncState,
        userId,
        user.googleDriveRootDirId,
        user.googleDriveSyncPreference,
        validToken,
        refreshToken,
      );
    }

    const userDirIds = await Directory.find({ userId }).distinct('_id');

    const files = await File.countDocuments({
      googleId: { $exists: true, $ne: null },
      parentDirId: { $in: userDirIds },
    });
    const folders = await Directory.countDocuments({
      googleId: { $exists: true, $ne: null },
      userId,
    });

    syncState.filesCount = files;
    syncState.foldersCount = folders;
    syncState.syncEndTime = new Date();
    syncState.status = 'idle';
    await syncState.save();

    await User.findByIdAndUpdate(userId, { lastSyncTime: new Date() });

    return {
      success: true,
      message: 'Google Drive sync completed',
      stats: {
        filesCount: files,
        foldersCount: folders,
        changesProcessed,
      },
    };
  } catch (error) {
    console.error('Error syncing Google Drive:', error);

    if (syncState) {
      syncState.status = 'error';
      syncState.error = error.message;
      await syncState.save();
    }

    throw error;
  }
};

const performInitialSync = async (
  drive,
  userId,
  googleDriveRootDirId,
  syncPreference,
  accessToken,
  refreshToken,
) => {
  const allItems = [];
  let pageToken;

  do {
    const result = await drive.files.list({
      pageSize: 1000,
      fields: `nextPageToken, files(${FILE_FIELDS})`,
      q: 'trashed = false',
      pageToken,
    });

    allItems.push(...(result.data.files || []));
    pageToken = result.data.nextPageToken;
  } while (pageToken);

  const folders = allItems.filter(
    (f) => f.mimeType === 'application/vnd.google-apps.folder',
  );
  const files = allItems.filter(
    (f) => f.mimeType !== 'application/vnd.google-apps.folder',
  );

  for (const folder of folders) {
    await upsertDriveItem(
      folder,
      userId,
      googleDriveRootDirId,
      syncPreference,
      accessToken,
      refreshToken,
      true,
    );
  }

  for (const file of files) {
    await upsertDriveItem(
      file,
      userId,
      googleDriveRootDirId,
      syncPreference,
      accessToken,
      refreshToken,
      false,
    );
  }

  return allItems.length;
};

const performIncrementalSync = async (
  drive,
  syncState,
  userId,
  googleDriveRootDirId,
  syncPreference,
  accessToken,
  refreshToken,
) => {
  let pageToken = syncState.pageToken;
  let newStartPageToken;
  let changesProcessed = 0;

  do {
    const result = await drive.changes.list({
      pageToken,
      fields: CHANGE_FIELDS,
      spaces: 'drive',
      includeCorpusRemovals: true,
    });

    const changes = result.data.changes || [];

    const folderChanges = [];
    const fileChanges = [];

    for (const change of changes) {
      if (change.removed || change.file?.trashed) {
        await handleRemoval(change, userId);
        changesProcessed++;
      } else if (change.file) {
        const isFolder =
          change.file.mimeType === 'application/vnd.google-apps.folder';
        if (isFolder) folderChanges.push(change.file);
        else fileChanges.push(change.file);
      }
    }

    for (const folder of folderChanges) {
      await upsertDriveItem(
        folder,
        userId,
        googleDriveRootDirId,
        syncPreference,
        accessToken,
        refreshToken,
        true,
      );
      changesProcessed++;
    }

    for (const file of fileChanges) {
      await upsertDriveItem(
        file,
        userId,
        googleDriveRootDirId,
        syncPreference,
        accessToken,
        refreshToken,
        false,
      );
      changesProcessed++;
    }

    if (result.data.newStartPageToken) {
      newStartPageToken = result.data.newStartPageToken;
    }
    pageToken = result.data.nextPageToken;
  } while (pageToken);

  if (newStartPageToken) {
    syncState.pageToken = newStartPageToken;
  }

  return changesProcessed;
};

const handleRemoval = async (change, userId) => {
  const googleId = change.file?.id || change.fileId;
  if (!googleId) return;

  const folder = await Directory.findOne({ googleId, userId });
  if (folder) {
    await Directory.deleteOne({ _id: folder._id });
    return;
  }

  const file = await File.findOne({ googleId, userId });
  if (file) {
    if (file.syncState === 'offline' || file.storageMode === 'offline') {
      const storagePath = getLocalStoragePath(file);
      await fsp.unlink(storagePath).catch(() => {});
    }
    await File.deleteOne({ _id: file._id });
  }
};

const resolveParentDirId = async (file, userId, googleDriveRootDirId) => {
  const parentGoogleId = file.parents?.[0];

  if (!parentGoogleId || parentGoogleId === 'root') {
    return googleDriveRootDirId;
  }

  const parentDir = await Directory.findOne({
    googleId: parentGoogleId,
    userId,
  });

  return parentDir ? parentDir._id : googleDriveRootDirId;
};

const upsertDriveItem = async (
  file,
  userId,
  googleDriveRootDirId,
  syncPreference,
  accessToken,
  refreshToken,
  isFolder,
) => {
  const parentDirId = await resolveParentDirId(
    file,
    userId,
    googleDriveRootDirId,
  );

  const commonFields = {
    name: file.name,
    parentDirId,
    webViewLink: file.webViewLink,
    owners: file.owners?.map((o) => o.emailAddress) || [],
    shared: file.shared || false,
    modifiedAt: file.modifiedTime ? new Date(file.modifiedTime) : new Date(),
  };

  if (isFolder) {
    const existing = await Directory.findOne({ googleId: file.id, userId });

    if (existing) {
      await Directory.updateOne({ _id: existing._id }, commonFields);
    } else {
      await Directory.create({
        googleId: file.id,
        userId,
        mimeType: file.mimeType,
        storageMode: 'metadata_only',
        ...commonFields,
      });
    }
    return;
  }

  const existing = await File.findOne({ googleId: file.id, userId });

  if (existing) {
    const storageMode =
      existing.storageMode === 'offline' ? 'offline' : 'metadata_only';
    const syncState =
      existing.syncState === 'offline' ? 'offline' : 'online_only';

    await File.updateOne(
      { _id: existing._id },
      {
        ...commonFields,
        size: file.size ? parseInt(file.size, 10) : 0,
        mimeType: file.mimeType,
        storageMode,
        syncState,
      },
    );

    if (
      syncPreference === 'full_file' &&
      existing.syncState !== 'offline' &&
      existing.syncState !== 'downloading'
    ) {
      downloadFileOffline(
        existing._id.toString(),
        file.id,
        accessToken,
        refreshToken,
      ).catch((err) =>
        console.error(`Auto-download failed for ${file.id}:`, err.message),
      );
    }
  } else {
    const newFile = await File.create({
      googleId: file.id,
      userId,
      extension: getFileExtension(file.name),
      mimeType: file.mimeType,
      size: file.size ? parseInt(file.size, 10) : 0,
      storageMode: syncPreference === 'full_file' ? 'offline' : 'metadata_only',
      syncState: syncPreference === 'full_file' ? 'downloading' : 'online_only',
      ...commonFields,
    });

    if (syncPreference === 'full_file') {
      downloadFileOffline(
        newFile._id.toString(),
        file.id,
        accessToken,
        refreshToken,
      ).catch((err) =>
        console.error(`Auto-download failed for ${file.id}:`, err.message),
      );
    }
  }
};

const getLocalStoragePath = (fileDoc) => {
  return path.join(
    STORAGE_DIR,
    `${fileDoc._id.toString()}${fileDoc.extension || ''}`,
  );
};

/**
 * Download file from Google Drive and store locally
 */
export const downloadFileOffline = async (
  fileId,
  googleId,
  accessToken,
  refreshToken,
  userId,
) => {
  try {
    const { accessToken: validToken } = await ensureValidToken(
      accessToken,
      refreshToken,
      userId,
    );
    const drive = createDriveClient(validToken, refreshToken);

    const fileDoc = await File.findById(fileId);
    if (!fileDoc) {
      throw new Error('File not found');
    }

    await File.updateOne(
      { _id: fileId },
      { syncState: 'downloading', downloadProgress: 0 },
    );

    const metadata = await drive.files.get({
      fileId: googleId,
      fields: 'size, mimeType, name',
    });

    const fileSize = parseInt(metadata.data.size || 0, 10);
    const destination = getLocalStoragePath(fileDoc);

    await fsp.mkdir(STORAGE_DIR, { recursive: true });

    await new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(destination);
      let downloadedBytes = 0;

      drive.files.get(
        { fileId: googleId, alt: 'media' },
        { responseType: 'stream' },
        (err, res) => {
          if (err) return reject(err);

          res.data
            .on('data', (chunk) => {
              downloadedBytes += chunk.length;
              const progress =
                fileSize > 0
                  ? Math.round((downloadedBytes / fileSize) * 100)
                  : 0;

              File.updateOne({ _id: fileId }, { downloadProgress: progress }).catch(
                (e) => console.error('Progress update error:', e),
              );
            })
            .on('end', () => {
              writeStream.close();
              resolve();
            })
            .on('error', (streamErr) => {
              writeStream.close();
              reject(streamErr);
            })
            .pipe(writeStream);
        },
      );
    });

    await File.updateOne(
      { _id: fileId },
      { syncState: 'offline', storageMode: 'offline', downloadProgress: 100 },
    );

    return { success: true, message: 'File downloaded successfully' };
  } catch (error) {
    console.error('Error downloading file:', error);

    await File.updateOne(
      { _id: fileId },
      { syncState: 'online_only', downloadProgress: 0 },
    ).catch((e) => console.error('Status update error:', e));

    throw error;
  }
};

/**
 * Stream Google Drive file directly without downloading
 */
export const getGoogleFileStream = async (
  googleId,
  accessToken,
  refreshToken,
  userId,
) => {
  const { accessToken: validToken } = await ensureValidToken(
    accessToken,
    refreshToken,
    userId,
  );
  const drive = createDriveClient(validToken, refreshToken);

  const response = await drive.files.get(
    { fileId: googleId, alt: 'media' },
    { responseType: 'stream' },
  );

  return response.data;
};

/**
 * Get sync status for user
 */
export const getSyncStatus = async (userId) => {
  const syncState = await GoogleDriveSyncState.findOne({ userId }).lean();
  return syncState || { status: 'idle', message: 'No sync data yet' };
};

/**
 * Delete file from Google Drive and optionally local storage
 */
export const deleteGoogleFile = async (
  fileId,
  googleId,
  accessToken,
  refreshToken,
  deleteLocal = false,
  userId,
) => {
  const { accessToken: validToken } = await ensureValidToken(
    accessToken,
    refreshToken,
    userId,
  );
  const drive = createDriveClient(validToken, refreshToken);

  await drive.files.delete({ fileId: googleId });

  if (deleteLocal) {
    const fileDoc = await File.findById(fileId);
    if (fileDoc) {
      const storagePath = getLocalStoragePath(fileDoc);
      await fsp.unlink(storagePath).catch(() => {});
    }
  }

  await File.deleteOne({ _id: fileId });

  return { success: true, message: 'File deleted successfully' };
};

/**
 * Upload file to Google Drive
 */
export const uploadToGoogleDrive = async (
  userId,
  fileId,
  filePath,
  fileName,
  parentDirId,
  mimeType,
  extension,
  accessToken,
  refreshToken,
) => {
  const { accessToken: validToken } = await ensureValidToken(
    accessToken,
    refreshToken,
    userId,
  );
  const drive = createDriveClient(validToken, refreshToken);

  const parentDir = await Directory.findById(parentDirId);
  if (!parentDir || parentDir.userId.toString() !== userId.toString()) {
    throw new Error('Parent directory not found');
  }

  const googleParentId =
    parentDir.googleId && parentDir.googleId !== 'root'
      ? parentDir.googleId
      : 'root';

  const fileMetadata = {
    name: fileName,
    parents: [googleParentId],
  };

  const media = {
    mimeType: mimeType || 'application/octet-stream',
    body: fs.createReadStream(filePath),
  };

  const response = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: 'id, name, mimeType, webViewLink, createdTime, modifiedTime, size',
  });

  const googleFile = response.data;

  const localFile = await File.create({
    _id: fileId,
    googleId: googleFile.id,
    userId,
    name: googleFile.name,
    extension: extension || getFileExtension(googleFile.name),
    parentDirId,
    mimeType: googleFile.mimeType,
    size: googleFile.size ? parseInt(googleFile.size, 10) : 0,
    webViewLink: googleFile.webViewLink,
    storageMode: 'offline',
    syncState: 'offline',
    modifiedAt: new Date(googleFile.modifiedTime),
  });

  return { success: true, file: localFile, googleFile };
};

const getFileExtension = (filename) => {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.substring(lastDot);
};

/**
 * Initialize Google Drive storage for new user
 */
export const initializeGoogleDriveStorage = async (
  userId,
  rootFolderName = 'Google Drive',
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (user.googleDriveRootDirId) {
    return {
      success: true,
      rootDir: await Directory.findById(user.googleDriveRootDirId),
      message: `Google Drive folder already exists as "${user.rootGoogleDriveName}"`,
    };
  }

  const rootDir = await Directory.create({
    name: rootFolderName,
    userId,
    parentDirId: user.rootDirId,
    storageMode: 'metadata_only',
    mimeType: 'application/vnd.google-apps.folder',
    googleId: 'root',
  });

  user.googleDriveRootDirId = rootDir._id;
  user.rootGoogleDriveName = rootFolderName;
  await user.save();

  return {
    success: true,
    rootDir,
    message: `Google Drive folder initialized as "${rootFolderName}"`,
  };
};

/**
 * Verify user owns a file via parent directory
 */
export const verifyFileOwnership = async (fileId, userId) => {
  const file = await File.findById(fileId).lean();
  if (!file) return null;

  const parentDir = await Directory.findById(file.parentDirId).lean();
  if (!parentDir || parentDir.userId.toString() !== userId.toString()) {
    return null;
  }

  return file;
};
