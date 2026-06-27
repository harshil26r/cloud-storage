import { Router } from 'express';
import {
  createDirectoryCtr,
  deleteDirectory,
  getDirectory,
  renameDirectory,
  getShareSettings,
  updateShareSettings,
  getSharedWithMe,
} from '../controllers/directoryController.js';

const dirRouter = Router();

dirRouter.get('/shared-with-me', getSharedWithMe);

dirRouter.get('/', getDirectory);
dirRouter.get('/:id', getDirectory);

dirRouter.post('/', createDirectoryCtr);
dirRouter.post('/:parentDirId', createDirectoryCtr);

dirRouter.route('/:id').patch(renameDirectory).delete(deleteDirectory);

dirRouter.route('/:id/share').get(getShareSettings).post(updateShareSettings);

export default dirRouter;
