import { Router } from 'express';
import isLogin from '../middleware/isLogin.js';
import {
  getUserDetails,
  login,
  logout,
  logoutAll,
  signup,
} from '../controllers/userController.js';

const userRoutes = Router();

userRoutes.post('/login', login);

userRoutes.post('/signup', signup);

userRoutes.post('/logout', logout);

userRoutes.post('/logoutAll', logoutAll);

userRoutes.get('/user', isLogin, getUserDetails);

export default userRoutes;
