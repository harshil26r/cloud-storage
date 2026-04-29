import { Router } from "express";
import { createWriteStream } from "fs";
import { rename, rm, writeFile } from "fs/promises";
import path from "path";
import multer from "multer";
import filesData from "../filesDB.json" with { type: "json" };
import directories from "../directoriesDB.json" with { type: "json" };

const fileRouter = Router();

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

fileRouter.get("/:id", (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "File ID is required" });
    }

    const fileInfo = filesData.find((file) => file.id === id);
    if (!fileInfo) {
      return res.status(404).json({ error: "File not found" });
    }

    if (req.query.action === "download") {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileInfo.name}"`,
      );
    }

    res.sendFile(`${process.cwd()}/storage/${id}${fileInfo.extenstion}`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

fileRouter.post("/", upload.single("file"), async (req, res) => {
  const parentDirId = req.body.parentDirId;
  const { id, extenstion, originalname } = req.file;

  if (!parentDirId) {
    return res.status(400).json({ error: "Parent directory ID is required" });
  }

  const parentDirData = directories.find(
    (directory) => directory.id === parentDirId,
  );

  if (!parentDirData) {
    return res.status(404).json({ error: "Parent directory not found" });
  }

  try {
    filesData.push({
      id,
      extenstion,
      name: originalname,
      parentDirId,
    });
    parentDirData.files.push(id);

    await writeFile("./filesDB.json", JSON.stringify(filesData), "utf8");
    await writeFile(
      "./directoriesDB.json",
      JSON.stringify(directories),
      "utf8",
    );

    res.status(201).json({ message: "File uploaded successfully", id });
  } catch (dbErr) {
    console.error(`Database error for file ${id}:`, dbErr);
    res.status(500).json({ error: "Failed to save file metadata" });
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

fileRouter.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const newName = req.body.newName?.trim();

    if (!id) {
      return res.status(400).json({ error: "File ID is required" });
    }

    if (!newName) {
      return res.status(400).json({ error: "New filename is required" });
    }

    const fileInfo = filesData?.find((file) => file?.id === id);

    if (!fileInfo) {
      return res.status(404).json({ error: "File not found" });
    }

    fileInfo.name = `${newName}`;
    await writeFile("./filesDB.json", JSON.stringify(filesData), "utf8");

    res.status(200).json({ message: "File renamed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

fileRouter.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "File ID is required" });
    }

    const fileIndex = filesData?.findIndex((file) => file.id === id);

    if (fileIndex === -1 || fileIndex === undefined) {
      return res.status(404).json({ error: "File not found" });
    }

    const fileInfo = filesData[fileIndex];

    if (!fileInfo) {
      return res.status(404).json({ error: "File not found" });
    }

    const parentDirData = directories.find(
      (directory) => fileInfo.parentDirId === directory.id,
    );

    if (!parentDirData) {
      return res.status(404).json({ error: "Parent directory not found" });
    }

    // Remove physical file
    await rm(`./storage/${id}${fileInfo.extenstion}`, { force: true }).catch(
      (err) => console.error(`Failed to delete physical file ${id}:`, err),
    );

    filesData.splice(fileIndex, 1);
    parentDirData.files = parentDirData.files.filter((file) => file !== id);

    await writeFile("./filesDB.json", JSON.stringify(filesData), "utf8");
    await writeFile(
      "./directoriesDB.json",
      JSON.stringify(directories),
      "utf8",
    );

    res.status(200).json({ message: "File deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default fileRouter;
