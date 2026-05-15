import { ObjectId } from 'mongodb';
import { User } from '../models/userModel.js';
import { Directory } from '../models/directoryModel.js';
import mongoose, { Types } from 'mongoose';

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, password }).lean();

  if (!user) {
    return res.status(404).json({ error: 'Invalid Credentials' });
  }
  res.cookie('uid', user._id.toString(), {
    maxAge: 60 * 1000 * 60,
    httpOnly: true,
  });

  res.json({ message: 'User login Sucessfully' });
};

export const signup = async (req, res) => {
  const { username, email, password } = req.body;

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
    res.status(500).json({ message: error });
  } finally {
    session.endSession();
  }
};

export const logout = (req, res) => {
  res.clearCookie('uid');
  res.json({ message: 'User logged out successfully' });
};

export const getUserDetails = (req, res) => {
  res.status(200).json({ email: req.user.email, username: req.user.username });
};
