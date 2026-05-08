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
      parentDirId: new ObjectId(parentDirId),
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
    const { user, db } = req;
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
    const { user, db } = req;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Directory ID is required' });
    }

    const directoriesCollection = db.collection('directories');
    const filesCollection = db.collection('files');

    const dirInfo = await directoriesCollection.findOne({
      _id: new ObjectId(id),
      userId: user._id,
    });

    console.log(dirInfo);

    if (!dirInfo) {
      return res
        .status(404)
        .json({ error: 'Directory not found for this user!' });
    }

    // Prevent deletion of root directory
    if (!dirInfo.parentDirId) {
      return res.status(403).json({ error: 'Cannot delete root directory' });
    }

    // Collect all child directories recursively
    const idsToDelete = new Set();

    async function collect(dirId) {
      idsToDelete.add(dirId.toString());

      const currentDir = await directoriesCollection.findOne({
        _id: new ObjectId(dirId),
      });
      if (!currentDir) return;

      await Promise.all(
        currentDir.directories.map((childId) => collect(childId)),
      );
    }

    await collect(id);

    // Remove reference from parent
    await directoriesCollection.updateOne(
      { _id: new ObjectId(dirInfo.parentDirId) },
      { $pull: { directories: new ObjectId(id) } },
    );

    // Find files to delete (for physical file removal)
    const objectIdsToDelete = [...idsToDelete].map(
      (dirId) => new ObjectId(dirId),
    );

    const filesToDelete = await filesCollection
      .find({ parentDirId: { $in: objectIdsToDelete } })
      .toArray();

    // Remove physical files
    await Promise.all(
      filesToDelete.map((file) =>
        rm(`./storage/${file._id.toString()}${file.extenstion}`, {
          force: true,
        }).catch((err) =>
          console.error(`Failed to delete file ${file._id}:`, err),
        ),
      ),
    );

    // Delete files from deleted directories
    await filesCollection.deleteMany({
      parentDirId: { $in: objectIdsToDelete },
    });

    // Delete all collected directories
    await directoriesCollection.deleteMany({ _id: { $in: objectIdsToDelete } });

    res.status(200).json({
      message: 'Directory deleted successfully',
      deletedCount: idsToDelete.size,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
export default dirRouter;
