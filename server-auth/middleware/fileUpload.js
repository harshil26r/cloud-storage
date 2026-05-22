import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import { ObjectId } from 'mongodb';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './storage');
  },
  filename: function (req, file, cb) {
    const id = new ObjectId();
    const extension = path.extname(file.originalname);
    file._id = id;
    file.extension = extension;
    cb(null, `${id}${extension}`);
  },
});

const upload = multer({ storage });

const fileUploadMiddleware = (req, res, next) => {
  upload.single('file')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: 'File upload failed' });
    }
    next();
  });
};

export default fileUploadMiddleware;
