import { Router } from 'express';
import {
  createDirectoryCtr,
  deleteDirectory,
  getDirectory,
  renameDirectory,
  getShareSettings,
  updateShareSettings,
  getSharedWithMe,
  trashDirectory,
  restoreDirectory,
  deleteDirectoryPermanent,
  getTrashBin,
  emptyTrash,
} from '../controllers/directoryController.js';

const dirRouter = Router();

dirRouter.get('/shared-with-me', getSharedWithMe);
dirRouter.get('/trash-bin', getTrashBin);

dirRouter.get('/', getDirectory);
dirRouter.get('/:id', getDirectory);

dirRouter.post('/', createDirectoryCtr);
dirRouter.post('/:parentDirId', createDirectoryCtr);

dirRouter.route('/:id').patch(renameDirectory).delete(deleteDirectory);

dirRouter.route('/:id/share').get(getShareSettings).post(updateShareSettings);

dirRouter.post('/trash/empty', emptyTrash);
dirRouter.patch('/:id/trash', trashDirectory);
dirRouter.patch('/:id/restore', restoreDirectory);
dirRouter.delete('/:id/permanent', deleteDirectoryPermanent);

export default dirRouter;
