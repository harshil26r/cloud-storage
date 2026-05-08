import { Router } from 'express';
import { createWriteStream } from 'fs';
import { rename, rm, writeFile } from 'fs/promises';
import filesData from '../filesDB.json' with { type: 'json' };
import directories from '../directoriesDB.json' with { type: 'json' };
import fileUploadMiddleware from '../middleware/fileUpload.js';
import { ObjectId } from 'mongodb';

const fileRouter = Router();

fileRouter.get('/:id', async (req, res) => {
  try {
    const { user, db } = req;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    const fileCollection = db.collection('files');
    const dirCollection = db.collection('directories');

    const fileInfo = await fileCollection.find({ _id: new ObjectId(id) });
    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }
    const parentDir = await dirCollection.findOne({
      parentDirId: new ObjectId(fileInfo.parentDirId),
    });

    if (parentDir?.userId !== user._id)
      return res
        .status(401)
        .json({ message: "You don't have permission to preview this file!" });

    if (req.query.action === 'download') {
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileInfo.name}"`,
      );
    }

    res.sendFile(`${process.cwd()}/storage/${id}${fileInfo.extenstion}`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

fileRouter.post('/', fileUploadMiddleware, async (req, res) => {
  const { db } = req;
  const parentDirId = req.body.parentDirId;
  const { _id, extenstion, originalname } = req.file;

  const fileCollection = db.collection('files');
  const dirCollection = db.collection('directories');

  if (!parentDirId) {
    return res.status(400).json({ error: 'Parent directory ID is required' });
  }

  const parentDirData = await dirCollection.findOne({
    _id: new ObjectId(parentDirId),
  });

  if (!parentDirData) {
    return res.status(404).json({ error: 'Parent directory not found' });
  }

  try {
    await fileCollection.insertOne({
      _id: new ObjectId(_id),
      extenstion,
      name: originalname,
      parentDirId: new ObjectId(parentDirId),
    });

    await dirCollection.updateOne(
      { _id: new ObjectId(parentDirId) },
      { $push: { files: _id } },
    );

    res.status(201).json({ message: 'File uploaded successfully', _id });
  } catch (dbErr) {
    console.error(`Database error for file ${_id}:`, dbErr);
    res.status(500).json({ error: 'Failed to save file metadata' });
  }
});

// fileRouter.post("/{:filename}", (req, res) => {
//   try {
//     const filename = req.params.filename?.trim() || "untitled.txt";
//     const parentDirId = req.headers.parentdirid || directories[0]?.id;

//     if (!filename) {
//       return res.status(400).json({ error: "Filename is required" });
//     }

//     if (!parentDirId) {
//       return res.status(400).json({ error: "Parent directory ID is required" });
//     }

//     const parentDirData = directories.find(
//       (directory) => directory.id === parentDirId,
//     );

//     if (!parentDirData) {
//       return res.status(404).json({ error: "Parent directory not found" });
//     }

//     const extenstion = path.extname(filename);
//     const id = crypto.randomUUID();
//     parentDirData.files.push(id);

//     const writableStream = createWriteStream(`./storage/${id}${extenstion}`);

//     writableStream.on("error", (err) => {
//       console.error(`Stream error for file ${id}:`, err);
//       res.status(500).json({ error: "Failed to write file" });
//     });

//     req.on("error", (err) => {
//       console.error(`Request error for file ${id}:`, err);
//       writableStream.destroy();
//       res.status(400).json({ error: "Upload interrupted" });
//     });

//     req.pipe(writableStream);

//     writableStream.on("finish", async () => {
//       try {
//         filesData.push({
//           id,
//           extenstion,
//           name: filename,
//           parentDirId,
//         });

//         await writeFile("./filesDB.json", JSON.stringify(filesData), "utf8");
//         await writeFile(
//           "./directoriesDB.json",
//           JSON.stringify(directories),
//           "utf8",
//         );

//         res.status(201).json({ message: "File uploaded successfully", id });
//       } catch (dbErr) {
//         console.error(`Database error for file ${id}:`, dbErr);
//         res.status(500).json({ error: "Failed to save file metadata" });
//       }
//     });
//   } catch (error) {
//     console.error("Upload error:", error);
//     res.status(500).json({ error: error.message || "File upload failed" });
//   }
// });

fileRouter.patch('/:id', async (req, res) => {
  try {
    const { user, db } = req;

    const { id } = req.params;
    const newName = req.body.newName?.trim();

    if (!id) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    if (!newName) {
      return res.status(400).json({ error: 'New filename is required' });
    }

    const fileCollection = db.collection('files');
    const dirCollection = db.collection('directories');

    const fileInfo = await fileCollection.findOne({ _id: new ObjectId(id) });

    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }

    const parentDir = await dirCollection.findOne({
      _id: new ObjectId(fileInfo.parentDirId),
    });

    console.log(parentDir?.userId, user._id, fileInfo);

    if (parentDir?.userId.toString() !== user._id.toString())
      return res
        .status(401)
        .json({ message: "You don't have permission to perform this action!" });

    await fileCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { name: newName } },
    );

    res.status(200).json({ message: 'File renamed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

fileRouter.delete('/:id', async (req, res) => {
  try {
    const { user, db } = req;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    const fileCollection = db.collection('files');
    const dirCollection = db.collection('directories');

    const fileInfo = await fileCollection.findOne({ _id: new ObjectId(id) });

    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }

    const parentDirData = await dirCollection.findOne({
      _id: new ObjectId(fileInfo.parentDirId),
    });

    if (!parentDirData) {
      return res.status(404).json({ error: 'Parent directory not found' });
    }

    if (parentDirData.userId.toString() !== user._id.toString()) {
      return res
        .status(401)
        .json({ message: "You don't have permission to perform this action!" });
    }

    // Remove physical file
    await rm(`./storage/${id}${fileInfo.extenstion}`, { force: true }).catch(
      (err) => console.error(`Failed to delete physical file ${id}:`, err),
    );

    fileCollection.deleteOne({ _id: new ObjectId(id) });
    dirCollection.updateOne(
      { _id: new ObjectId(fileInfo.parentDirId) },
      { $pull: { files: new ObjectId(id) } },
    );

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default fileRouter;
