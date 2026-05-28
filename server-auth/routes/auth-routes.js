import { Router } from 'express';
import isLogin from '../middleware/isLogin.js';
import { sendOtp, verifyOtp } from '../controllers/authController.js';

const authRouter = Router();

authRouter.post('/send-otp', sendOtp);

authRouter.post('/verify-otp', verifyOtp);

export default authRouter;
