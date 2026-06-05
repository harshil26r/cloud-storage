import crypto from 'crypto';
import { OTP } from '../models/optModel.js';
import { sendEmail } from '../services/sentEmail.js';
import { emailTemplate } from '../utils/emailTemplate.js';
import { verifyGoogleToken } from '../services/googleAuth.js';
import { User } from '../models/userModel.js';
import { Session } from '../models/sessionModel.js';

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
        await user.save();
      }
      user.save();

      res.cookie('sid', session.id, {
        maxAge: 60 * 1000 * 60 * 5,
        httpOnly: true,
        signed: true,
      });

      res.json({ message: 'User login Sucessfully' });
    }

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
            picture,
          },
        ],
        { session },
      );
      const createdUser = await User.create(
        [{ _id: userId, username, email, password, rootDirId }],
        { session },
      );

      const session = await Session.create({ userId: user.id });

      res.cookie('sid', session.id, {
        maxAge: 60 * 1000 * 60 * 5,
        httpOnly: true,
        signed: true,
      });

      session.commitTransaction();

      res.status(201).json({
        message: `User Register and Login Succesfully with email ${email}`,
      });
    } catch (error) {
      session.abortTransaction();
      res.status(500).json({ message: error });
    } finally {
      session.endSession();
    }

    res.status(200).json({ message: 'Google login successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
