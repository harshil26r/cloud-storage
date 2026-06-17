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
  toggleStarDirectory,
  getStarredItems,
  searchItems,
} from '../controllers/directoryController.js';

import { validateParams } from '../middleware/validateObjectId.js';

const dirRouter = Router();

dirRouter.get('/shared-with-me', getSharedWithMe);
dirRouter.get('/trash-bin', getTrashBin);
dirRouter.get('/starred', getStarredItems);
dirRouter.get('/search', searchItems);

dirRouter.get('/', getDirectory);
dirRouter.get('/:id', validateParams('id'), getDirectory);

dirRouter.post('/', createDirectoryCtr);
dirRouter.post('/:parentDirId', validateParams('parentDirId'), createDirectoryCtr);

dirRouter.route('/:id').patch(validateParams('id'), renameDirectory).delete(validateParams('id'), deleteDirectory);

dirRouter.route('/:id/share').get(validateParams('id'), getShareSettings).post(validateParams('id'), updateShareSettings);

dirRouter.post('/trash/empty', emptyTrash);
dirRouter.patch('/:id/trash', validateParams('id'), trashDirectory);
dirRouter.patch('/:id/restore', validateParams('id'), restoreDirectory);
dirRouter.delete('/:id/permanent', validateParams('id'), deleteDirectoryPermanent);
dirRouter.patch('/:id/star', validateParams('id'), toggleStarDirectory);

export default dirRouter;
