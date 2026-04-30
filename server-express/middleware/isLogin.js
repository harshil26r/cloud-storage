import usersData from '../usersDB.json' with { type: 'json' };

const isLogin = (req, res, next) => {
  const { uid } = req.cookies;

  if (!uid) return res.status(401).json({ message: 'Please Login First' });

  const foundUser = usersData.find((user) => user.id === uid);

  if (!foundUser) return res.status(404).json({ message: 'User Not Found!' });

  req.user = foundUser;

  next();
};
export default isLogin;
