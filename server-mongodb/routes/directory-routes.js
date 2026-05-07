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

    const id = req.params.id || user.rootDirId;

    if (!id) {
      return res.status(400).json({ error: 'No directory ID provided' });
    }
    const fileCollection = db.collection('files');
    const dirCollection = db.collection('directories');
    const directoryData = await dirCollection.findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(user._id),
    });

    if (!directoryData) {
      return res
        .status(404)
        .json({ error: 'Directory not found for this user' });
    }

    const files = await Promise.all(
      directoryData.files.map((fileId) =>
        fileCollection.findOne({ _id: fileId }),
      ),
    );
    const directories = await Promise.all(
      directoryData.directories.map((directoryId) =>
        dirCollection.findOne({ _id: directoryId }),
      ),
    );

    res.status(200).json({ ...directoryData, files, directories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

dirRouter.post('/{:parentDirId}', async (req, res) => {
  try {
    const { user, db } = req;

    const parentDirId = req.params.parentDirId || user.rootDirId.toString();
    const dirName = req.body.dirName?.trim();

    if (!parentDirId) {
      return res.status(400).json({ error: 'No parent directory ID provided' });
    }

    if (!dirName) {
      return res.status(400).json({ error: 'Directory name is required' });
    }

    // Verify parent directory exists
    const dirCollection = db.collection('directories');

    const parentDir = dirCollection.findOne({ _id: new ObjectId(parentDirId) });

    if (!parentDir) {
      return res.status(404).json({ error: 'Parent directory not found' });
    }

    const id = new ObjectId();

    await dirCollection.updateOne(
      {
        _id: new ObjectId(parentDirId),
        userId: new ObjectId(user._id),
      },
      { $push: { directories: id } },
    );

    dirCollection.insertOne({
      _id: id,
      name: dirName,
      userId: user._id,
      parentDirId,
      files: [],
      directories: [],
    });

    res.status(201).json({ message: 'Directory created successfully', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

dirRouter.patch('/:id', async (req, res) => {
  try {
    const { db } = req;
    const id = req.params.id;
    const newName = req.body.newName?.trim();

    if (!id) {
      return res.status(400).json({ error: 'Directory ID is required' });
    }

    if (!newName) {
      return res.status(400).json({ error: 'New directory name is required' });
    }
    const dirCollection = db.collection('directories');
    const directoryData = await dirCollection.findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(user._id),
    });

    if (!directoryData) {
      return res
        .status(404)
        .json({ error: 'Directory not found for this user!' });
    }

    await dirCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { name: newName } },
    );

    res.status(200).json({ message: 'Directory renamed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

dirRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Directory ID is required' });
    }

    const dirInfo = directoriesData.find(
      (dir) => dir.id === id && dir.userId === req.user.id,
    );

    if (!dirInfo) {
      return res
        .status(404)
        .json({ error: 'Directory not found for this user!' });
    }

    // Prevent deletion of root directory
    if (!dirInfo.parentDirId) {
      return res.status(403).json({ error: 'Cannot delete root directory' });
    }

    const dirMap = new Map(directoriesData.map((dir) => [dir.id, dir]));
    const idsToDelete = new Set();

    // collect all child directories recursively
    function collect(dirId) {
      idsToDelete.add(dirId);

      const currentDir = dirMap.get(dirId);
      if (!currentDir) return;

      currentDir.directories.forEach((childId) => collect(childId));
    }

    collect(id);

    // remove reference from parent
    if (dirInfo.parentDirId) {
      const parentDir = directoriesData.find(
        (dir) => dir.id === dirInfo.parentDirId,
      );

      if (parentDir) {
        parentDir.directories = parentDir.directories.filter(
          (childId) => childId !== id,
        );
      }
    }

    // delete directories
    const newDirData = directoriesData.filter(
      (dir) => !idsToDelete.has(dir.id),
    );

    // delete files from deleted directories
    const filesToDelete = filesData.filter((file) =>
      idsToDelete.has(file.parentDirId),
    );

    const newFilesData = filesData.filter(
      (file) => !idsToDelete.has(file.parentDirId),
    );

    // remove physical files
    await Promise.all(
      filesToDelete.map((file) =>
        rm(`./storage/${file.id}${file.extenstion}`, { force: true }).catch(
          (err) => console.error(`Failed to delete file ${file.id}:`, err),
        ),
      ),
    );

    // save db
    await writeFile('./filesDB.json', JSON.stringify(newFilesData), 'utf8');
    await writeFile('./directoriesDB.json', JSON.stringify(newDirData), 'utf8');

    res.status(200).json({
      message: 'Directory deleted successfully',
      deletedCount: idsToDelete.size,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default dirRouter;
