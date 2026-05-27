import { Router } from 'express';
import isLogin from '../middleware/isLogin.js';
import {
  getUserDetails,
  login,
  logout,
  logoutAll,
  signup,
} from '../controllers/userController.js';

const authRouter = Router();

authRouter.post('/login', login);

authRouter.post('/signup', signup);

authRouter.post('/logout', logout);

export default authRouter;
