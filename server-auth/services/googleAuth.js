import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

const client = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

export async function verifyGoogleToken(token) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.VITE_GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return payload; // Contains user information like email, name, etc.
  } catch (error) {
    console.error('Error verifying Google token:', error);
    throw new Error('Invalid Google token');
  }
}

export const getGoogleDriveTokens = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  return { tokens };
};

/**
 * Refresh Google Access Token using refresh token
 * @param {string} refreshToken - Google refresh token
 * @returns {Promise<string>} - New access token
 */
export const refreshGoogleAccessToken = async (refreshToken) => {
  try {
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials.access_token;
  } catch (error) {
    console.error('Error refreshing Google access token:', error);
    throw new Error('Failed to refresh Google token');
  }
};

/**
 * Create authenticated Google Drive API client
 * @param {string} accessToken - Google access token
 * @returns {google.drive} - Authenticated Drive API instance
 */
export const createDriveClient = (accessToken, refreshToken) => {
  const authClient = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  authClient.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.drive({
    version: 'v3',
    auth: authClient,
  });
};

/**
 * Verify and refresh token if needed
 * @param {string} accessToken - Current access token
 * @param {string} refreshToken - Refresh token for token renewal
 * @returns {Promise<string>} - Valid access token
 */
export const ensureValidToken = async (
  accessToken,
  refreshToken,
  userId = null,
) => {
  try {
    const testClient = createDriveClient(accessToken, refreshToken);
    const drive = google.drive({ version: 'v3', auth: testClient });
    await drive.about.get({ fields: 'user' });
    return { accessToken, refreshed: false };
  } catch (error) {
    if (refreshToken) {
      const newAccessToken = await refreshGoogleAccessToken(refreshToken);

      if (userId) {
        const { User } = await import('../models/userModel.js');
        await User.findByIdAndUpdate(userId, {
          googleAccessToken: newAccessToken,
        });
      }

      return { accessToken: newAccessToken, refreshed: true };
    }
    throw error;
  }
};
