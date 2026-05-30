import { Router } from 'express';
import isLogin from '../middleware/isLogin.js';
import {
  loginWithGoogle,
  sendOtp,
  verifyOtp,
} from '../controllers/authController.js';

const authRouter = Router();

authRouter.post('/send-otp', sendOtp);

authRouter.post('/verify-otp', verifyOtp);

authRouter.post('/google-login', loginWithGoogle);

export default authRouter;
