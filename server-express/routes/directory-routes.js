import { Router } from "express";
import { readdir } from "fs/promises";
import mime from "mime";
import directories from "../directoriesDB.json" with { type: "json" };
import filesData from "../filesDB.json" with { type: "json" };

const dirRouter = Router();

dirRouter.get("/{:id}", async (req, res) => {
  const { id } = req.params;
  if (!id) {
    res.status(200).send(directories[0]);
  } else {
    const directoryData = directories?.find((folder) => folder.id === id);

    const files = directoryData.files.map((fileId) =>
      filesData.find((file) => file.id === fileId),
    );

    if (directoryData) {
      res.status(200).send({ ...directoryData, files });
    }
  }
});

export default dirRouter;
