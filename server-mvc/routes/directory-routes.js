import { Router } from 'express';
import { readdir, rm, writeFile } from 'fs/promises';
import mime from 'mime';
import { client } from '../middleware/mongoConnect.js';
import {
  creatDirectory,
  deleteDirectory,
  getDirectory,
  renameDirectory,
} from '../controllers/directoryController.js';

const dirRouter = Router();

dirRouter.get('/{:id}', getDirectory);

dirRouter.post('/{:parentDirId}', creatDirectory);

dirRouter.route('/:id').patch(renameDirectory).delete(deleteDirectory);

export default dirRouter;
