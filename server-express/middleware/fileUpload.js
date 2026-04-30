import multer from "multer";
import crypto from "crypto";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./storage");
  },
  filename: function (req, file, cb) {
    const id = crypto.randomUUID();
    const extenstion = path.extname(file.originalname);
    file.id = id;
    file.extenstion = extenstion;
    cb(null, `${id}${extenstion}`);
  },
});

const upload = multer({ storage });

const fileUploadMiddleware = (req, res, next) => {
  upload.single("file")(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: "File upload failed" });
    }
    next();
  });
};

export default fileUploadMiddleware;
