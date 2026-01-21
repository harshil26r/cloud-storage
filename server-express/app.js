import express from "express";
import { open, readdir, rename, rm } from "fs/promises";
import mime from "mime";

const app = express();
const port = 4000;

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

app.use(express.json()); // parse body for all request

app.get("/:filename", async (req, res) => {
  console.log(req.url);

  try {
    const items = await readdir(`./storage${req.url}`, {
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

// app.post("/", (req, res) => {
//   res.send("Got a POST request");
// });

// app.put("/user", (req, res) => {
//   res.send("Got a PUT request at /user");
// });

// app.delete("/user", (req, res) => {
//   res.send("Got a DELETE request at /user");
// });

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
