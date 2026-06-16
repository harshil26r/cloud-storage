import { ObjectId } from 'mongodb';
import { User } from '../models/userModel.js';
import { Directory } from '../models/directoryModel.js';
import { Session } from '../models/sessionModel.js';
import mongoose, { Types } from 'mongoose';
import { buffer } from 'node:stream/consumers';
import { getStorageUsed, STORAGE_LIMIT } from '../utils/storageHelper.js';

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ error: 'Invalid Credentials' });
  }

  if (!user.password) {
    return res.status(400).json({
      error: 'This account was created with Google. Please use Google Login.',
    });
  }

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  const validPass = await user.comparePassword(password);

  if (!validPass) {
    return res.status(404).json({ error: 'Invalid Credentials' });
  }

  const session = await Session.create({ userId: user.id });

  res.cookie('sid', session.id, {
    maxAge: 60 * 1000 * 60 * 5,
    httpOnly: true,
    signed: true,
  });

  res.json({ message: 'User login Successfully' });
};

export const signup = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || username.trim().length < 3) {
    return res
      .status(400)
      .json({ error: 'Username must be at least 3 characters long' });
  }

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!password || password.trim().length < 3) {
    return res
      .status(400)
      .json({ error: 'Password must be at least 3 characters long' });
  }

  const existingUser = await User.findOne({ email }).lean();

  if (existingUser)
    return res.status(409).json({ error: 'Email id already Register!' });

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const userId = new Types.ObjectId();
    const rootDirId = new Types.ObjectId();

    const rootDir = await Directory.create(
      [
        {
          _id: rootDirId,
          name: 'root',
          parentDirId: null,
          userId,
        },
      ],
      { session },
    );
    const createdUser = await User.create(
      [{ _id: userId, username, email, password, rootDirId }],
      { session },
    );

    session.commitTransaction();

    res
      .status(201)
      .json({ message: `User Register Succesfully with email ${email}` });
  } catch (error) {
    session.abortTransaction();
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const logout = async (req, res) => {
  const { sid } = req.signedCookies;
  await Session.findByIdAndDelete(sid);

  res.clearCookie('sid');
  res.json({ message: 'User logged out successfully' });
};

export const logoutAll = async (req, res) => {
  const { sid } = req.signedCookies;
  const session = await Session.findById(sid);

  await Session.deleteMany({ userId: session.userId });

  res.clearCookie('sid');
  res.json({ message: 'User logged out from all devices successfully' });
};

export const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const storageUsed = await getStorageUsed(user._id);
    const storageTotal = STORAGE_LIMIT;

    res.status(200).json({
      email: user.email,
      username: user.username,
      picture: user.picture,
      googleDriveConnected: !!user.googleAccessToken,
      googleDriveRootDirId: user.googleDriveRootDirId,
      storageUsed,
      storageTotal,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length < 2) {
      return res
        .status(400)
        .json({ error: 'Search query must be at least 2 characters' });
    }
    const users = await User.find({
      _id: { $ne: req.user?._id },
      $or: [
        { email: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } },
      ],
    })
      .select('username email picture')
      .limit(10)
      .lean();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
