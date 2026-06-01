/**
 * Token Refresh Middleware
 * Automatically refreshes expired Google tokens before each request
 * Attached to isLogin middleware for authenticated routes
 */

import { User } from '../models/userModel.js';
import { refreshGoogleAccessToken } from '../services/googleAuth.js';

export const refreshTokenMiddleware = async (req, res, next) => {
  try {
    const { user } = req;

    if (!user || !user.googleRefreshToken) {
      return next();
    }

    // Check if token needs refresh (simple approach: refresh if older than 50 mins)
    const user_data = await User.findById(user._id).lean();

    if (!user_data.lastSyncTime) {
      return next();
    }

    const timeSinceLastSync = Date.now() - user_data.lastSyncTime.getTime();
    const fiftyMinutesInMs = 50 * 60 * 1000;

    if (timeSinceLastSync > fiftyMinutesInMs) {
      try {
        const newAccessToken = await refreshGoogleAccessToken(
          user_data.googleRefreshToken,
        );

        await User.findByIdAndUpdate(user._id, {
          googleAccessToken: newAccessToken,
          lastSyncTime: new Date(),
        });

        req.user.googleAccessToken = newAccessToken;
      } catch (error) {
        console.warn(
          'Token refresh failed, continuing without refresh:',
          error.message,
        );
      }
    }

    next();
  } catch (error) {
    console.error('Token refresh middleware error:', error);
    next();
  }
};

export default refreshTokenMiddleware;
