import { Hono } from "hono";
import {
  batchDeleteUserFiles,
  deleteUserFile,
  downloadFile,
  getUserFiles,
  uploadFile,
} from "../controllers/files.controller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const app = new Hono();

app.get("/", authMiddleware, getUserFiles);
app.get("/:file_id/download", authMiddleware, downloadFile);
app.delete("/", authMiddleware, batchDeleteUserFiles);
app.delete("/:file_id", authMiddleware, deleteUserFile);
app.post("/upload", authMiddleware, uploadFile);

export default app;
