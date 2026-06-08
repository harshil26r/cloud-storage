import { Directory } from '../models/directoryModel.js';
import { File } from '../models/fileModel.js';
import { deleteDirectoryTree } from '../services/googleDriveService.js';

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

export const createDirectoryCtr = async (req, res) => {
  try {
    const { user } = req;

    const parentDirId = req.params.parentDirId;
    const dirName = req.body.dirName?.trim();

    if (!parentDirId) {
      return res.status(400).json({ error: 'No parent directory ID provided' });
    }

    if (!dirName) {
      return res.status(400).json({ error: 'Directory name is required' });
    }

    const parentDir = await Directory.findOne({ _id: parentDirId });

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
      id: createdDir._id,
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
  try {
    const { user } = req;
    const _id = req.params.id;

    const stats = await deleteDirectoryTree(_id, user._id);

    res.status(200).json({
      message: 'Directory deleted successfully',
      ...stats,
    });
  } catch (err) {
    console.error('Delete directory error:', err);
    res.status(500).json({ error: err.message });
  }
};
