import { Router } from 'express';
import { writeFile } from 'fs/promises';

import usersData from '../usersDB.json' with { type: 'json' };
import directoriesData from '../directoriesDB.json' with { type: 'json' };
import { ObjectId } from 'mongodb';

const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { db } = req;
  const { email, password } = req.body;

  const userCollection = db.collection('users');
  const user = await userCollection.findOne({ email, password });

  if (!user) {
    return res.status(404).json({ message: 'Invalide Credentials' });
  }
  res.cookie('uid', user._id.toString(), {
    maxAge: 60 * 1000 * 60,
    httpOnly: true,
  });

  res.json({ message: 'User login Sucessfully' });
});

authRouter.post('/signup', async (req, res) => {
  const { db } = req;
  const { username, email, password } = req.body;

  const userCollection = db.collection('users');
  const dirCollection = db.collection('directories');

  const existingUser = await userCollection.findOne({ email });

  if (existingUser)
    return res.status(409).json({ message: 'Email id already Register!' });

  const userId = new ObjectId();
  const rootDirId = new ObjectId();

  try {
    userCollection.insertOne({
      _id: userId,
      rootDirId,
      username,
      email,
      password,
    });
    dirCollection.insertOne({
      _id: rootDirId,
      name: 'root',
      parentDirId: null,
      userId,
      files: [],
      directories: [],
    });

    res
      .status(201)
      .json({ message: `User Register Succesfully with email ${email}` });
  } catch (error) {
    res.error({ message: error });
  }
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie('uid');
  res.json({ message: 'User logged out successfully' });
});

authRouter.get('/user', async (req, res) => {
  const { db } = req;
  const userId = req.cookies.uid;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userCollection = db.collection('users');
  const user = await userCollection.findOne({ _id: new ObjectId(userId) });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json({ email: user.email, username: user.username });
});

export default authRouter;
