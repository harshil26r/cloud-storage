import { Router } from 'express';
import { createWriteStream } from 'fs';
import { rm } from 'fs/promises';
import fileUploadMiddleware from '../middleware/fileUpload.js';
import {
  deleteFile,
  renameFile,
  serveFile,
  uploadFIle,
} from '../controllers/fileController.js';

const fileRouter = Router();

fileRouter.get('/:id', serveFile);

fileRouter.post('/', fileUploadMiddleware, uploadFIle);

fileRouter.route('/:id').patch(renameFile).delete(deleteFile);

export default fileRouter;
