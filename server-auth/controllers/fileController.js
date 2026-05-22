import { File } from '../models/fileModel.js';
import { Directory } from '../models/directoryModel.js';
import { rm } from 'fs/promises';

export const serveFile = async (req, res) => {
  try {
    const { user } = req;
    const _id = req.params.id;

    if (!_id) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    const fileInfo = await File.findOne({ _id }).lean();
    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }
    const parentDir = await Directory.findOne({
      _id: fileInfo.parentDirId,
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
};

export const uploadFIle = async (req, res) => {
  const parentDirId = req.body.parentDirId;
  const { _id, extension, originalname } = req.file;

  try {
    const fileCollection = await File.create({
      _id,
      extension,
      name: originalname,
      parentDirId,
    });

    fileCollection.save();

    res.status(201).json({ message: 'File uploaded successfully', _id });
  } catch (dbErr) {
    console.error(`Database error for file ${_id}:`, dbErr);
    res.status(500).json({ error: 'Failed to save file metadata' });
  }
};

export const renameFile = async (req, res) => {
  try {
    const { user } = req;

    const _id = req.params.id;
    const newName = req.body.newName?.trim();

    if (!_id) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    if (!newName) {
      return res.status(400).json({ error: 'New filename is required' });
    }

    const fileInfo = await File.findOne({ _id });

    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }

    const parentDir = await Directory.findOne({
      _id: fileInfo.parentDirId,
    });

    if (parentDir?.userId.toString() !== user._id.toString())
      return res
        .status(401)
        .json({ error: "You don't have permission to perform this action!" });

    await File.updateOne({ _id }, { $set: { name: newName } });

    res.status(200).json({ message: 'File renamed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const { user, db } = req;
    const _id = req.params.id;

    if (!_id) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    const fileInfo = await File.findOne({ _id });

    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }

    const parentDirData = await Directory.findOne({
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

    await File.deleteOne({ _id });

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: err.message });
  }
};
