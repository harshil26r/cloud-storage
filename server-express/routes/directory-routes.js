import { Router } from "express";
import { readdir, rm, writeFile } from "fs/promises";
import mime from "mime";
import directoriesData from "../directoriesDB.json" with { type: "json" };
import filesData from "../filesDB.json" with { type: "json" };

const dirRouter = Router();

dirRouter.get("/{:id}", async (req, res) => {
  const id = req.params.id || directoriesData[0].id;

  const directoryData = directoriesData?.find(
    (directory) => directory.id === id,
  );

  const files = directoryData.files.map((fileId) =>
    filesData.find((file) => file.id === fileId),
  );
  const directories = directoryData.directories.map((directoryId) =>
    directoriesData.find((directory) => directory.id === directoryId),
  );

  if (directoryData) {
    res.status(200).send({ ...directoryData, files, directories });
  }
});

dirRouter.post("/{:parentDirId}", async (req, res) => {
  const parentDirId = req.params.parentDirId || directoriesData[0].id;
  const dirName = req.body.dirName;

  const id = crypto.randomUUID();

  const parentDirData = directoriesData
    .find((directory) => directory.id === parentDirId)
    .directories.push(id);

  directoriesData.push({
    id,
    name: dirName,
    parentDirId,
    files: [],
    directories: [],
  });

  try {
    await writeFile(
      "./directoriesDB.json",
      JSON.stringify(directoriesData),
      "utf8",
    );
    res.json({ message: "Directory Created!" });
  } catch (err) {
    res.json({ err: err.message });
  }
});

dirRouter.patch("/:id", async (req, res) => {
  const id = req.params.id;

  const directoryData = directoriesData?.find(
    (directory) => directory.id === id,
  );

  if (directoryData) {
    directoryData.name = req.body.newName;
    await writeFile(
      "./directoriesDB.json",
      JSON.stringify(directoriesData),
      "utf8",
    );
    res.status(200).send({ message: "Folder Renamed" });
  }
});

dirRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const dirInfo = directoriesData.find((dir) => dir.id === id);

    if (!dirInfo) {
      return res.status(404).json({ message: "Directory not found" });
    }

    const dirMap = new Map(directoriesData.map((dir) => [dir.id, dir]));
    const idsToDelete = new Set();

    // collect all child directories recursively
    function collect(dirId) {
      idsToDelete.add(dirId);

      const currentDir = dirMap.get(dirId);
      if (!currentDir) return;

      currentDir.directories.forEach((childId) => collect(childId));
    }

    collect(id);

    // remove reference from parent
    if (dirInfo.parentDirId) {
      const parentDir = directoriesData.find(
        (dir) => dir.id === dirInfo.parentDirId,
      );

      if (parentDir) {
        parentDir.directories = parentDir.directories.filter(
          (childId) => childId !== id,
        );
      }
    }

    // delete directories
    const newDirData = directoriesData.filter(
      (dir) => !idsToDelete.has(dir.id),
    );

    // delete files from deleted directories
    const filesToDelete = filesData.filter((file) =>
      idsToDelete.has(file.parentDirId),
    );

    const newFilesData = filesData.filter(
      (file) => !idsToDelete.has(file.parentDirId),
    );

    // remove physical files
    await Promise.all(
      filesToDelete.map((file) =>
        rm(`./storage/${file.id}${file.extenstion}`, { force: true }),
      ),
    );

    // save db
    await writeFile("./filesDB.json", JSON.stringify(newFilesData), "utf8");

    await writeFile("./directoriesDB.json", JSON.stringify(newDirData), "utf8");

    res.json({ message: "Folder deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default dirRouter;
