import { ObjectId } from 'mongodb';
import { User } from '../models/userModel.js';

const isLogin = async (req, res, next) => {
  const { db } = req;
  const { token } = req.signedCookies;

  if (!token) {
    res.clearCookie('token');
    return res.status(401).json({ error: 'Please Login First' });
  }

  const { id, expire } = JSON.parse(Buffer.from(token, 'base64url').toString());

  const currentTime = Math.floor(Date.now() / 1000);

  if (expire < currentTime) {
    res.clearCookie('token');
    return res.status(401).json({ error: 'Please Login First' });
  }

  const foundUser = await User.findOne({ _id: id }).lean();

  if (!foundUser) return res.status(404).json({ error: 'User Not Found!' });

  req.user = foundUser;

  next();
};
export default isLogin;
