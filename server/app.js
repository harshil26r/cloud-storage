import { createWriteStream } from "fs";
import { open, readdir, rename, rm } from "fs/promises";
import http from "http";
import mime from "mime";

const PORT = 4000;

const setHeader = (name, value, res) => {
  res.setHeader(name, value);
};

const parseURL = (req) => {
  const [url] = req?.url?.split("?");
  return url;
};

const parseQueryParams = (req) => {
  const [, queryString] = req?.url?.split("?");
  const queryParam = {};
  queryString?.split("&").forEach((pair) => {
    const [key, value] = pair.split("=");
    queryParam[key] = value;
  });

  return queryParam;
};

const serveDirectory = async (req, res) => {
  try {
    const items = await readdir(`./storage${parseURL(req)}`, {
      withFileTypes: true,
    });

    const result = items.map((item) => ({
      name: item.name,
      type: item.isDirectory() ? "folder" : `file : ${mime.getType(item.name)}`,
    }));

    setHeader("Content-Type", "application/json", res);
    res.end(JSON.stringify(result));
  } catch (error) {
    res.statusCode = 500;
    res.end(error.message);
  }
};

const handleGETRequest = async (req, res) => {
  if (req.url === "/favicon.ico") return res.end("No favicon.");
  if (req.url === "/") {
    serveDirectory(req, res);
  } else {
    try {
      const filePath = `./storage${decodeURIComponent(parseURL(req))}`;
      const fileHandle = await open(filePath);
      const stats = await fileHandle.stat();
      if (stats.isDirectory()) {
        await fileHandle.close();
        serveDirectory(req, res);
      } else {
        // Set the correct Content-Type header based on file extension
        const mimeType = mime.getType(filePath);
        if (mimeType) {
          setHeader("Content-Type", mimeType, res);
        }
        const params = parseQueryParams(req);

        if (params?.action === "download") {
          setHeader(
            "Content-Disposition",
            `attachment; filename="${parseURL(req).slice(1)}`,
            res
          );
        }

        const readStream = fileHandle.createReadStream();
        readStream.pipe(res);

        // Ensure file handle is closed only once
        let isClosed = false;
        const closeHandle = async () => {
          if (!isClosed) {
            isClosed = true;
            await fileHandle.close();
          }
        };

        // Close when response finishes or client disconnects
        res.on("finish", closeHandle);
        res.on("close", closeHandle);

        readStream.on("error", async (err) => {
          console.log("Stream error:", err.message);
          await closeHandle();
        });
      }
    } catch (err) {
      console.log(err.message);
      res.end("Not Found!");
    }
  }
};
const handlePOSTRequest = (req, res) => {
  const writeStream = createWriteStream(
    `./storage/${req.headers.directory}/${req.headers.filename}`
  );
  let count = 0;
  req.on("data", (chunk) => {
    count++;
    writeStream.write(chunk);
  });
  req.on("end", () => {
    console.log(count);
    writeStream.end();
    res.end("File uploaded on the server");
  });
};
const handleDELETERequest = (req, res) => {
  req.on("data", async (chunk) => {
    try {
      const filename = chunk.toString();
      await rm(`./storage/${filename}`);
      res.end("File deleted successfully");
    } catch (err) {
      res.end(err.message);
    }
  });
};
const handlePATCHRequest = (req, res) => {
  req.on("data", async (chunk) => {
    const data = JSON.parse(chunk.toString());
    await rename(`./storage${data.oldFile}`, `./storage${data.newFile}`);
    res.end("File renamed");
  });
};
const handleOPTIONRequest = (res) => {
  res.end("OK");
};

const server = http.createServer(async (req, res) => {
  setHeader("Access-Control-Allow-Origin", "*", res);
  setHeader("Access-Control-Allow-Headers", "*", res);
  setHeader("Access-Control-Allow-Methods", "*", res);

  switch (req.method) {
    case "GET":
      handleGETRequest(req, res);
      break;
    case "POST":
      handlePOSTRequest(req, res);
      break;
    case "DELETE":
      handleDELETERequest(req, res);
      break;
    case "PATCH":
      handlePATCHRequest(req, res);
      break;
    case "OPTIONS":
      handleOPTIONRequest(res);
      break;
  }
});

server.listen(PORT, () => {
  console.log(`Server started on ${PORT}`);
});
