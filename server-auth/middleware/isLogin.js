import { ObjectId } from 'mongodb';
import { User } from '../models/userModel.js';
import { Session } from '../models/sessionModel.js';

const isLogin = async (req, res, next) => {
  const { db } = req;
  const { sid } = req.signedCookies;

  const session = await Session.findById(sid);

  if (!sid || !session?.id) {
    res.clearCookie('sid');
    return res.status(401).json({ error: 'Please Login First' });
  }

  const foundUser = await User.findOne({ _id: session.userId }).lean();

  if (!foundUser) return res.status(404).json({ error: 'User Not Found!' });

  req.user = foundUser;

  next();
};
export default isLogin;
