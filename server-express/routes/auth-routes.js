import { Router } from "express";
import { writeFile } from "fs/promises";

import usersData from "../usersDB.json" with { type: "json" };
import directoriesData from "../directoriesDB.json" with { type: "json" };

const authRouter = Router();

authRouter.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = usersData.find(
    (user) => user.email === email && user.password === password,
  );
  if (!user) {
    return res.status(404).json({ message: "Invalide Credentials" });
  }
  res.cookie("uid", user.id, {
    maxAge: 60 * 1000 * 60,
    httpOnly: true,
  });

  res.json({ message: "User login Sucessfully" });
});

authRouter.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  const existingUser = usersData.find((user) => user.email === email);

  if (existingUser)
    return res.status(409).json({ message: "Email id already Register!" });

  const userId = crypto.randomUUID();
  const rootDirId = crypto.randomUUID();

  try {
    usersData.push({
      id: userId,
      rootDirId,
      username,
      email,
      password,
    });
    directoriesData.push({
      id: rootDirId,
      name: "root",
      parentDirId: null,
      userId,
      files: [],
      directories: [],
    });

    await writeFile("./usersDB.json", JSON.stringify(usersData), "utf8");
    await writeFile(
      "./directoriesDB.json",
      JSON.stringify(directoriesData),
      "utf8",
    );

    res
      .status(201)
      .json({ message: `User Register Succesfully with email ${email}` });
  } catch (error) {
    res.error({ message: error });
  }
});

export default authRouter;
