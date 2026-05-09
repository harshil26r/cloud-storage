import { ObjectId } from 'mongodb';
import usersData from '../usersDB.json' with { type: 'json' };

const isLogin = async (req, res, next) => {
  const { db } = req;
  const { uid } = req.cookies;

  if (!uid) return res.status(401).json({ error: 'Please Login First' });

  const foundUser = await db
    .collection('users')
    .findOne({ _id: new ObjectId(uid) });

  if (!foundUser) return res.status(404).json({ error: 'User Not Found!' });

  req.user = foundUser;

  next();
};
export default isLogin;
