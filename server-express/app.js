import express from "express";
import { createWriteStream } from "fs";
import { readdir, rename, rm } from "fs/promises";
import mime from "mime";
import cors from 'cors'

const app = express();
const port = 4000;

app.use(express.json()); // parse body for all request
app.use(cors())

app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  next();
});

app.use((req, res, next) => {
  if (req.query.action === "download") {
    res.set("Content-Disposition", `attachment;`);
  }
  express.static("storage")(req, res, next); // serve public folder
});


app.get("/?*", async (req, res) => {
  const { 0: filePath } = req.params

  try {
    const items = await readdir(`./storage${filePath === '' ? '' : '/' + filePath}`, {
      withFileTypes: true,
    });

    const result = items.map((item) => ({
      name: item.name,
      type: item.isDirectory() ? "folder" : `file : ${mime.getType(item.name)}`,
    }));

    res.status(200).json(result);
  } catch (error) {
    res.status(501).json({ message: "internal error" });
  }
});

app.post("/?*", (req, res) => {
  const { 0: filePath } = req.params

  const writableStream = createWriteStream(`./storage/${filePath === '' ? '' : '/' + filePath}`)
  req.pipe(writableStream)
  req.on('end', () => {
    res.json({ message: "File Uploaded" });
  })
});

app.patch('/?*', async (req, res) => {
  const { 0: filePath } = req.params

  await rename(`./storage/${filePath}`, `./storage${req.body?.newFileName}`);
  res.json({ message: "File renamed" });

})

app.delete("/?*", async (req, res) => {
  const { 0: filePath } = req.params
  try {
    await rm(`./storage/${filePath}`);
    res.json({ message: "File deleted successfully" });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
