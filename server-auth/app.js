import express from 'express';
import cors from 'cors';
import dirRouter from './routes/directory-routes.js';
import fileRouter from './routes/files-routes.js';
import authRouter from './routes/auth-routes.js';
import googleDriveRouter from './routes/google-drive-routes.js';
import cookieParser from 'cookie-parser';
import isLogin from './middleware/isLogin.js';
import refreshTokenMiddleware from './middleware/refreshToken.js';
import { connectDB } from './middleware/mongoConnect.js';
import userRoutes from './routes/user-routes.js';
import { startTrashCleaner } from './services/trashCleaner.js';

const port = 4000;
const app = express();

const db = await connectDB();

// Run cleanup scheduler
startTrashCleaner();

app.use(express.json()); // parse body for all request
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(cookieParser(process.env.COOKIE_SECRET || 'fsdf'));

app.use((req, res, next) => {
  req.db = db;
  next();
});

app.use((req, res, next) => {
  if (req.query.action === 'download') {
    res.set('Content-Disposition', `attachment;`);
  }
  express.static('storage')(req, res, next); // serve public folder
});

// Global Error Handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: `Something went wrong! ${err}` });
});
// Directory routes
app.use('/directory', isLogin, dirRouter);

// File routes
app.use('/file', isLogin, fileRouter);

// User routes
app.use('/user', userRoutes);

// Auth routes
app.use('/auth', authRouter);

// Google Drive routes
app.use('/google-drive', isLogin, refreshTokenMiddleware, googleDriveRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
