import express from 'express';
import cors from 'cors';
import dirRouter from './routes/directory-routes.js';
import fileRouter from './routes/files-routes.js';
import authRouter from './routes/auth-routes.js';
import cookieParser from 'cookie-parser';
import isLogin from './middleware/isLogin.js';
import connectDB from './middleware/mongoConnect.js';

const port = 4000;
const app = express();

app.use(connectDB);

app.use(express.json()); // parse body for all request
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(cookieParser());

app.use((req, res, next) => {
  if (req.query.action === 'download') {
    res.set('Content-Disposition', `attachment;`);
  }
  express.static('storage')(req, res, next); // serve public folder
});

// Directory routes
app.use('/directory', isLogin, dirRouter);

// File routes
app.use('/file', isLogin, fileRouter);

// Auth routes
app.use('/auth', authRouter);

// Globle Error Handler
app.use((err, req, res, next) => {
  res
    .status(err.status || 500)
    .json({ message: `Something went wrong! ${err}` });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
