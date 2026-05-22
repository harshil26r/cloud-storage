import mongoose from 'mongoose';
import { Directory } from '../models/directoryModel.js';
import { File } from '../models/fileModel.js';

export const getDirectory = async (req, res) => {
  try {
    const { user } = req;

    const _id = req.params.id ? req.params.id : user.rootDirId;

    if (!_id) {
      return res.status(400).json({ error: 'No directory ID provided' });
    }
    const directoryData = await Directory.findOne({
      _id,
      userId: user?._id,
    }).lean();

    if (!directoryData) {
      return res
        .status(404)
        .json({ error: 'Directory not found for this user' });
    }

    const files = await File.find({ parentDirId: _id }).lean();
    const directories = await Directory.find({ parentDirId: _id }).lean();

    res.status(200).json({ ...directoryData, files, directories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const creatDirectory = async (req, res) => {
  try {
    const { user, db } = req;

    const parentDirId = req.params.parentDirId;
    const dirName = req.body.dirName?.trim();

    if (!parentDirId) {
      return res.status(400).json({ error: 'No parent directory ID provided' });
    }

    if (!dirName) {
      return res.status(400).json({ error: 'Directory name is required' });
    }

    const parentDir = Directory.findOne({ _id: parentDirId });

    if (!parentDir) {
      return res.status(404).json({ error: 'Parent directory not found' });
    }

    const createdDir = await Directory.create({
      name: dirName,
      userId: user._id,
      parentDirId,
    });

    await createdDir.save();

    res.status(201).json({
      message: 'Directory created successfully',
      id: createdDir.insertedId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const renameDirectory = async (req, res) => {
  try {
    const { user } = req;
    const _id = req.params.id;
    const newName = req.body.newName?.trim();

    if (!_id) {
      return res.status(400).json({ error: 'Directory ID is required' });
    }

    if (!newName) {
      return res.status(400).json({ error: 'New directory name is required' });
    }
    const directoryData = await Directory.findOne({
      _id,
      userId: user._id,
    });

    if (!directoryData) {
      return res
        .status(404)
        .json({ error: 'Directory not found for this user!' });
    }

    await Directory.updateOne({ _id }, { $set: { name: newName } });

    res.status(200).json({ message: 'Directory renamed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteDirectory = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { user } = req;
    const _id = req.params.id;

    // First find the target directory itself by _id
    const targetDir = await Directory.findOne({ _id }).lean();

    if (!targetDir) {
      return res.status(404).json({ error: 'Directory not found' });
    }

    async function collectAllChildDirIds(parentId) {
      const childDirs = await Directory.find({
        parentDirId: parentId,
      }).lean();

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
    const allFiles = await File.find({
      parentDirId: { $in: allDirIds },
    }).lean();

    // Delete actual files from storage
    await Promise.all(
      allFiles.map((file) => rm(`./storage/${file._id}${file.extension}`)),
    );

    session.startTransaction();

    // Delete file documents from DB
    await File.deleteMany(
      {
        parentDirId: { $in: allDirIds },
      },
      { session },
    );

    // Delete all directories from DB
    await Directory.deleteMany(
      {
        _id: { $in: allDirIds },
      },
      { session },
    );

    session.commitTransaction();

    res.status(200).json({
      message: 'Directory deleted successfully',
      deletedDirsCount: allDirIds.length,
      deletedFilesCount: allFiles.length,
    });
  } catch (err) {
    session.abortTransaction();
    res.status(500).json({ error: err.message });
  }
};
