import { Router } from 'express';
import { writeFile } from 'fs/promises';

import usersData from '../usersDB.json' with { type: 'json' };
import directoriesData from '../directoriesDB.json' with { type: 'json' };
import { ObjectId } from 'mongodb';
import isLogin from '../middleware/isLogin.js';

const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { db } = req;
  const { email, password } = req.body;

  const user = await db.collection('users').findOne({ email, password });

  if (!user) {
    return res.status(404).json({ message: 'Invalid Credentials' });
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

  const existingUser = await db.collection('users').findOne({ email });

  if (existingUser)
    return res.status(409).json({ message: 'Email id already Register!' });

  try {
    const dirCollection = db.collection('directories');
    const rootDir = await dirCollection.insertOne({
      name: 'root',
      parentDirId: null,
    });
    const createdUser = await db.collection('users').insertOne({
      username,
      email,
      password,
      rootDirId: rootDir.insertedId,
    });

    await dirCollection.updateOne(
      { _id: rootDir.insertedId },
      { $set: { userId: createdUser.insertedId } },
    );

    res
      .status(201)
      .json({ message: `User Register Succesfully with email ${email}` });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie('uid');
  res.json({ message: 'User logged out successfully' });
});

authRouter.get('/user', isLogin, (req, res) => {
  res.status(200).json({ email: req.user.email, username: req.user.username });
});

export default authRouter;
