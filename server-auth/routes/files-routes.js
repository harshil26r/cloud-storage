import { Router } from 'express';
import fileUploadMiddleware from '../middleware/fileUpload.js';
import {
  deleteFile,
  renameFile,
  serveFile,
  uploadFile,
  getShareSettings,
  updateShareSettings,
  trashFile,
  restoreFile,
  deleteFilePermanent,
  toggleStarFile,
  getRecentFiles,
} from '../controllers/fileController.js';
import { getThumbnail } from '../controllers/thumbnailController.js';

import { validateParams } from '../middleware/validateObjectId.js';

const fileRouter = Router();

fileRouter.get('/thumbnail/:id', validateParams('id'), getThumbnail);

fileRouter.get('/recent', getRecentFiles);
fileRouter.get('/:id', validateParams('id'), serveFile);

fileRouter.post('/', fileUploadMiddleware, uploadFile);

fileRouter.route('/:id').patch(validateParams('id'), renameFile).delete(validateParams('id'), deleteFile);

fileRouter.route('/:id/share').get(validateParams('id'), getShareSettings).post(validateParams('id'), updateShareSettings);

fileRouter.patch('/:id/trash', validateParams('id'), trashFile);
fileRouter.patch('/:id/restore', validateParams('id'), restoreFile);
fileRouter.delete('/:id/permanent', validateParams('id'), deleteFilePermanent);
fileRouter.patch('/:id/star', validateParams('id'), toggleStarFile);

export default fileRouter;
