import { ObjectId } from 'mongodb';

export const login = async (req, res) => {
  const { db } = req;
  const { email, password } = req.body;

  const user = await db.collection('users').findOne({ email, password });

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
  const { db } = req;
  const { username, email, password } = req.body;

  const existingUser = await db.collection('users').findOne({ email });

  if (existingUser)
    return res.status(409).json({ error: 'Email id already Register!' });

  const session = client.startSession();
  try {
    const dirCollection = db.collection('directories');

    session.startTransaction();

    const rootDir = await dirCollection.insertOne(
      {
        name: 'root',
        parentDirId: null,
      },
      { session },
    );
    const createdUser = await db.collection('users').insertOne(
      {
        username,
        email,
        password,
        rootDirId: rootDir.insertedId,
      },
      { session },
    );

    await dirCollection.updateOne(
      { _id: rootDir.insertedId },
      { $set: { userId: createdUser.insertedId } },
      { session },
    );

    session.commitTransaction();

    res
      .status(201)
      .json({ message: `User Register Succesfully with email ${email}` });
  } catch (error) {
    session.abortTransaction();
    res.status(500).json({ message: error });
  }
};

export const logout = (req, res) => {
  res.clearCookie('uid');
  res.json({ message: 'User logged out successfully' });
};

export const getUserDetails = (req, res) => {
  res.status(200).json({ email: req.user.email, username: req.user.username });
};
