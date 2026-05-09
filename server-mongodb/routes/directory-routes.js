import { Router } from 'express';
import { readdir, rm, writeFile } from 'fs/promises';
import mime from 'mime';
import directoriesData from '../directoriesDB.json' with { type: 'json' };
import filesData from '../filesDB.json' with { type: 'json' };
import usersData from '../usersDB.json' with { type: 'json' };
import { ObjectId } from 'mongodb';

const dirRouter = Router();

dirRouter.get('/{:id}', async (req, res) => {
  try {
    const { user, db } = req;

    const _id = req.params.id ? new ObjectId(req.params.id) : user.rootDirId;

    if (!_id) {
      return res.status(400).json({ error: 'No directory ID provided' });
    }
    const dirCollection = db.collection('directories');
    const directoryData = await dirCollection.findOne({
      _id,
      userId: user._id,
    });

    if (!directoryData) {
      return res
        .status(404)
        .json({ error: 'Directory not found for this user' });
    }

    const files = await db
      .collection('files')
      .find({ parentDirId: _id })
      .toArray();
    const directories = await dirCollection
      .find({ parentDirId: _id })
      .toArray();

    res.status(200).json({ ...directoryData, files, directories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

dirRouter.post('/{:parentDirId}', async (req, res) => {
  try {
    const { user, db } = req;

    const parentDirId = req.params.parentDirId
      ? new ObjectId(req.params.parentDirId)
      : user.rootDirId;
    const dirName = req.body.dirName?.trim();

    if (!parentDirId) {
      return res.status(400).json({ error: 'No parent directory ID provided' });
    }

    if (!dirName) {
      return res.status(400).json({ error: 'Directory name is required' });
    }

    // Verify parent directory exists
    const dirCollection = db.collection('directories');

    const parentDir = dirCollection.findOne({ _id: parentDirId });

    if (!parentDir) {
      return res.status(404).json({ error: 'Parent directory not found' });
    }

    const createdDir = await dirCollection.insertOne({
      name: dirName,
      userId: user._id,
      parentDirId,
    });

    res.status(201).json({
      message: 'Directory created successfully',
      id: createdDir.insertedId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

dirRouter.patch('/:id', async (req, res) => {
  try {
    const { user, db } = req;
    const _id = new ObjectId(req.params.id);
    const newName = req.body.newName?.trim();

    if (!_id) {
      return res.status(400).json({ error: 'Directory ID is required' });
    }

    if (!newName) {
      return res.status(400).json({ error: 'New directory name is required' });
    }
    const dirCollection = db.collection('directories');
    const directoryData = await dirCollection.findOne({
      _id,
      userId: user._id,
    });

    if (!directoryData) {
      return res
        .status(404)
        .json({ error: 'Directory not found for this user!' });
    }

    await dirCollection.updateOne({ _id }, { $set: { name: newName } });

    res.status(200).json({ message: 'Directory renamed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

dirRouter.delete('/:id', async (req, res) => {
  try {
    const { user, db } = req;
    const _id = new ObjectId(req.params.id);

    const directoriesCollection = db.collection('directories');
    const filesCollection = db.collection('files');

    // First find the target directory itself by _id
    const targetDir = await directoriesCollection.findOne({ _id });

    if (!targetDir) {
      return res.status(404).json({ error: 'Directory not found' });
    }

    async function collectAllChildDirIds(parentId) {
      const childDirs = await directoriesCollection
        .find({ parentDirId: parentId })
        .toArray();

      let allIds = [parentId];

      for (const dir of childDirs) {
        const childIds = await collectAllChildDirIds(dir._id);
        allIds = allIds.concat(childIds);
      }

      return allIds;
    }

    // Start recursion from the target dir's _id
    const allDirIds = await collectAllChildDirIds(targetDir._id);

    // Fetch all files before deleting to get their IDs and extensions
    const allFiles = await filesCollection
      .find({ parentDirId: { $in: allDirIds } })
      .toArray();

    // Delete actual files from storage
    await Promise.all(
      allFiles.map((file) => rm(`./storage/${file._id}${file.extension}`)),
    );

    // Delete file documents from DB
    await filesCollection.deleteMany({
      parentDirId: { $in: allDirIds },
    });

    // Delete all directories from DB
    await directoriesCollection.deleteMany({
      _id: { $in: allDirIds },
    });

    res.status(200).json({
      message: 'Directory deleted successfully',
      deletedDirsCount: allDirIds.length,
      deletedFilesCount: allFiles.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
export default dirRouter;
