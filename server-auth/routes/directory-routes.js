import { Router } from 'express';
import {
  createDirectoryCtr,
  deleteDirectory,
  getDirectory,
  renameDirectory,
} from '../controllers/directoryController.js';

const dirRouter = Router();

dirRouter.get('/{:id}', getDirectory);

dirRouter.post('/{:parentDirId}', createDirectoryCtr);

dirRouter.route('/:id').patch(renameDirectory).delete(deleteDirectory);

export default dirRouter;
