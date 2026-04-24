import { Router } from "express";
import { createWriteStream } from "fs";
import { rename, rm, writeFile } from "fs/promises";
import path from "path";
import filesData from "../filesDB.json" with { type: "json" };

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
    res.status(200).send({ message: "file is find" });
  }
});

fileRouter.post("/:filename", (req, res) => {
  const { filename } = req.params;

  const extenstion = path.extname(filename);
  const id = crypto.randomUUID();

  const writableStream = createWriteStream(`./storage/${id}${extenstion}`);

  req.pipe(writableStream);
  req.on("end", async () => {
    filesData.push({
      id,
      extenstion,
      name: filename,
    });

    await writeFile("./filesDB.json", JSON.stringify(filesData), "utf8");

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
  try {
    await rm(`./storage/${id}${fileInfo?.extenstion}`);
    filesData?.splice(fileIndex, 1);
    await writeFile("./filesDB.json", JSON.stringify(filesData), "utf8");

    res.json({ message: "File deleted successfully" });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
});

export default fileRouter;
