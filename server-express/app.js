import express from "express";
import cors from "cors";
import dirRouter from "./routes/directory-routes.js";
import fileRouter from "./routes/files-routes.js";
// import jsonServer from 'json-server'
// import path from "path"

const port = 4000;
const app = express();

app.use(express.json()); // parse body for all request
app.use(cors());

app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  if (req.query.action === "download") {
    res.set("Content-Disposition", `attachment;`);
  }
  express.static("storage")(req, res, next); // serve public folder
});

// Directory routes
app.use("/directory", dirRouter);

// File routes
app.use("/file", fileRouter);

// Globle Error Handler
// app.use((err, req, res, next) => {
//   res
//     .status(err.status || 500)
//     .json({ message: `Something went wrong! ${err}` });
// });

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
