import { Hono } from "hono";
import {
  createFolder,
  deleteFolder,
  getFolders,
  updateFolder,
} from "../controllers/folders.controller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const app = new Hono();

app.get("/", authMiddleware, getFolders);
app.post("/", authMiddleware, createFolder);
app.patch("/:folder_id", authMiddleware, updateFolder);
app.delete("/:folder_id", authMiddleware, deleteFolder);

export default app;
