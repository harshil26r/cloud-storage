import { Router } from 'express';
import fileUploadMiddleware from '../middleware/fileUpload.js';
import {
  deleteFile,
  renameFile,
  serveFile,
  uploadFile,
  getShareSettings,
  updateShareSettings,
} from '../controllers/fileController.js';
import { getThumbnail } from '../controllers/thumbnailController.js';

const fileRouter = Router();

fileRouter.get('/thumbnail/:id', getThumbnail);

fileRouter.get('/:id', serveFile);

fileRouter.post('/', fileUploadMiddleware, uploadFile);

fileRouter.route('/:id').patch(renameFile).delete(deleteFile);

fileRouter.route('/:id/share')
  .get(getShareSettings)
  .post(updateShareSettings);

export default fileRouter;
