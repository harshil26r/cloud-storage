import { Router } from 'express';
import isLogin from '../middleware/isLogin.js';
import refreshTokenMiddleware from '../middleware/refreshToken.js';
import {
  connectGoogleDrive,
  disconnectGoogleDrive,
  loginWithGoogle,
  sendOtp,
  verifyOtp,
} from '../controllers/authController.js';

const authRouter = Router();

authRouter.post('/send-otp', sendOtp);

authRouter.post('/verify-otp', verifyOtp);

authRouter.post('/google-login', loginWithGoogle);

authRouter.post(
  '/google-drive/connect',
  isLogin,
  refreshTokenMiddleware,
  connectGoogleDrive,
);

authRouter.post(
  '/google-drive/disconnect',
  isLogin,
  refreshTokenMiddleware,
  disconnectGoogleDrive,
);

export default authRouter;
