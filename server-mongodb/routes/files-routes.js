import { Router } from 'express';
import { createWriteStream } from 'fs';
import { rename, rm, writeFile } from 'fs/promises';
import filesData from '../filesDB.json' with { type: 'json' };
import directories from '../directoriesDB.json' with { type: 'json' };
import fileUploadMiddleware from '../middleware/fileUpload.js';
import { ObjectId } from 'mongodb';

const fileRouter = Router();

fileRouter.get('/:id', async (req, res) => {
  try {
    const { user, db } = req;
    const _id = new ObjectId(req.params.id);

    if (!_id) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    const fileInfo = await db.collection('files').find({ _id });
    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }
    const parentDir = await db.collection('directories').findOne({
      parentDirId: fileInfo.parentDirId,
    });

    if (parentDir?.userId.toString() !== user._id.toString())
      return res
        .status(401)
        .json({ error: "You don't have permission to preview this file!" });

    if (req.query.action === 'download') {
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileInfo.name}"`,
      );
    }

    res.sendFile(
      `${process.cwd()}/storage/${_id.toString()}${fileInfo.extension}`,
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

fileRouter.post('/', fileUploadMiddleware, async (req, res) => {
  const { db } = req;
  const parentDirId = req.body.parentDirId
    ? new ObjectId(req.body.parentDirId)
    : undefined;
  const { _id, extension, originalname } = req.file;

  try {
    const fileCollection = await db.collection('files').insertOne({
      _id,
      extension,
      name: originalname,
      parentDirId,
    });

    res.status(201).json({ message: 'File uploaded successfully', _id });
  } catch (dbErr) {
    console.error(`Database error for file ${_id}:`, dbErr);
    res.status(500).json({ error: 'Failed to save file metadata' });
  }
});

fileRouter.patch('/:id', async (req, res) => {
  try {
    const { user, db } = req;

    const _id = req.params.id ? new ObjectId(req.params.id) : undefined;
    const newName = req.body.newName?.trim();

    if (!_id) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    if (!newName) {
      return res.status(400).json({ error: 'New filename is required' });
    }

    const fileCollection = db.collection('files');
    const fileInfo = await fileCollection.findOne({ _id });

    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }

    const parentDir = await db.collection('directories').findOne({
      _id: fileInfo.parentDirId,
    });

    if (parentDir?.userId.toString() !== user._id.toString())
      return res
        .status(401)
        .json({ error: "You don't have permission to perform this action!" });

    await fileCollection.updateOne({ _id }, { $set: { name: newName } });

    res.status(200).json({ message: 'File renamed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

fileRouter.delete('/:id', async (req, res) => {
  try {
    const { user, db } = req;
    const _id = req.params.id ? new ObjectId(req.params.id) : undefined;

    if (!_id) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    const fileCollection = db.collection('files');
    const fileInfo = await fileCollection.findOne({ _id });

    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }

    const parentDirData = await db.collection('directories').findOne({
      _id: fileInfo.parentDirId,
    });

    if (!parentDirData) {
      return res.status(404).json({ error: 'Parent directory not found' });
    }

    if (parentDirData.userId.toString() !== user._id.toString()) {
      return res
        .status(401)
        .json({ error: "You don't have permission to perform this action!" });
    }

    // Remove physical file
    await rm(`./storage/${_id}${fileInfo.extension}`, {
      force: true,
    }).catch((err) =>
      console.error(`Failed to delete physical file ${_id}:`, err),
    );

    fileCollection.deleteOne({ _id });

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default fileRouter;
