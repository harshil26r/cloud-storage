import { Router } from "express";
import { readdir } from "fs/promises";
import mime from "mime";

const dirRouter = Router();

dirRouter.get("/{*splat}", async (req, res) => {
    const filePath = req.params.splat
    try {
        const items = await readdir(`./storage/${filePath === undefined ? '' : '/' + filePath?.join('/')}`, {
            withFileTypes: true,
        });

        const result = items.map((item) => ({
            name: item.name,
            type: item.isDirectory() ? "folder" : `file : ${mime.getType(item.name)}`,
        }));

        res.status(200).json(result);
    } catch (error) {
        console.log(error);

        res.status(501).json({ message: "internal error" });
    }
});

export default dirRouter;