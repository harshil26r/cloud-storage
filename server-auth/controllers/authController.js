import crypto from 'crypto';
import mongoose, { Types } from 'mongoose';
import { OTP } from '../models/otpModel.js';
import { sendEmail } from '../services/sentEmail.js';
import { emailTemplate } from '../utils/emailTemplate.js';
import {
  getGoogleDriveTokens,
  verifyGoogleToken,
} from '../services/googleAuth.js';
import { User } from '../models/userModel.js';
import { Session } from '../models/sessionModel.js';
import { Directory } from '../models/directoryModel.js';

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const otp = crypto.randomBytes(3).toString('hex');

    await OTP.findOneAndUpdate(
      { email },
      { otp, createdAt: new Date() },
      { upsert: true },
    );

    await sendEmail(email, 'Your OTP Code for Storage App', emailTemplate(otp));

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      return res.status(404).json({ error: 'OTP not found for this email' });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    await OTP.deleteOne({ email });

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const loginWithGoogle = async (req, res) => {
  try {
    const { tokenId } = req.body;

    if (!tokenId) {
      return res.status(400).json({ error: 'Google token is required' });
    }

    // Verify the Google token and get user info
    const userInfo = await verifyGoogleToken(tokenId);

    const { name, email, picture, sub } = userInfo;

    const user = await User.findOne({ email });

    if (user) {
      const session = await Session.create({ userId: user.id });

      if (!user.picture.includes('googleusercontent.com')) {
        user.picture = picture;
      }
      // Update Google ID if not present
      if (!user.googleId) {
        user.googleId = sub;
      }
      await user.save();

      res.cookie('sid', session.id, {
        maxAge: 60 * 1000 * 60 * 5,
        httpOnly: true,
        signed: true,
      });

      return res.json({ message: 'User login Successfully' });
    }

    // Create new user
    const mongooseSession = await mongoose.startSession();
    try {
      mongooseSession.startTransaction();

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
        { session: mongooseSession },
      );

      const createdUser = await User.create(
        [
          {
            _id: userId,
            username: name,
            email,
            picture,
            googleId: sub,
            rootDirId,
          },
        ],
        { session: mongooseSession },
      );

      const dbSession = await Session.create({ userId });

      await mongooseSession.commitTransaction();

      res.cookie('sid', dbSession.id, {
        maxAge: 60 * 1000 * 60 * 5,
        httpOnly: true,
        signed: true,
      });

      res.status(201).json({
        message: `User registered and logged in successfully with email ${email}`,
      });
    } catch (error) {
      await mongooseSession.abortTransaction();
      res.status(500).json({ message: error.message });
    } finally {
      await mongooseSession.endSession();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Connect Google Drive to user account
 * Exchanges auth code for access and refresh tokens
 */
export const connectGoogleDrive = async (req, res) => {
  try {
    const { user } = req;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const { tokens } = await getGoogleDriveTokens(code);

    if (!tokens.access_token) {
      throw new Error('Failed to obtain access token');
    }

    // Update user with tokens
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
      },
      { new: true },
    );

    res.status(200).json({
      message: 'Google Drive connected successfully',
      googleDriveConnected: true,
      requiresSetup: !updatedUser.googleDriveRootDirId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Disconnect Google Drive from user account
 * Revokes tokens and removes connection
 */
export const disconnectGoogleDrive = async (req, res) => {
  try {
    const { user } = req;

    // Clear Google Drive tokens
    await User.findByIdAndUpdate(user._id, {
      $unset: {
        googleAccessToken: '',
        googleRefreshToken: '',
      },
    });

    res.status(200).json({
      message: 'Google Drive disconnected successfully',
      googleDriveConnected: false,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
