import { Router } from "express";
import { createWriteStream } from "fs";
import { rename, rm, writeFile } from "fs/promises";
import path from "path";
import filesData from "../filesDB.json" with { type: "json" };
import directories from "../directoriesDB.json" with { type: "json" };

const fileRouter = Router();

fileRouter.get("/:id", (req, res) => {
  const { id } = req.params;
  const fileInfo = filesData.find((file) => file.id === id);
  if (req.query.action === "download") {
    res.setHeader("Content-Disposistion", "attachment");
  }
  if (fileInfo) {
    res.sendFile(
      `${process.cwd()}/storage/${id}${fileInfo.extenstion}`,
      (err) => err && res.send({ message: `${err}` }),
    );
    // res.status(200).send({ message: "file is find" });
  }
});

fileRouter.post("/:filename", (req, res) => {
  const { filename } = req.params;
  const parentDirId = req.header.parentdirid || directories[0].id;

  const parentDirData = directories.find(
    (directory) => directory.id === parentDirId,
  );

  const extenstion = path.extname(filename);
  const id = crypto.randomUUID();
  parentDirData.files.push(id);

  const writableStream = createWriteStream(`./storage/${id}${extenstion}`);

  req.pipe(writableStream);
  req.on("end", async () => {
    filesData.push({
      id,
      extenstion,
      name: filename,
      parentDirId,
    });

    await writeFile("./filesDB.json", JSON.stringify(filesData), "utf8");
    await writeFile(
      "./directoriesDB.json",
      JSON.stringify(directories),
      "utf8",
    );

    res.json({ message: "File Uploaded" });
  });
});

fileRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;

  const fileInfo = filesData?.find((file) => file?.id === id);
  fileInfo.name = `${req.body.newFileName}${fileInfo.extenstion}`;
  await writeFile("./filesDB.json", JSON.stringify(filesData), "utf8");

  res.json({ message: "File renamed" });
});

fileRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const fileIndex = filesData?.findIndex((file) => file.id === id);
  const fileInfo = filesData[fileIndex];
  const parentDirData = directories.find(
    (directory) => fileInfo.parentDirId === directory.id,
  );

  try {
    await rm(`./storage/${id}${fileInfo?.extenstion}`);
    filesData?.splice(fileIndex, 1);
    parentDirData.files = parentDirData.files.filter((file) => file !== id);
    await writeFile("./filesDB.json", JSON.stringify(filesData), "utf8");
    await writeFile(
      "./directoriesDB.json",
      JSON.stringify(directories),
      "utf8",
    );

    res.json({ message: "File deleted successfully" });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
});

export default fileRouter;
