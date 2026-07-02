import { Hono } from "hono";
import {
  batchDeleteUserFiles,
  deleteUserFile,
  downloadFile,
  getSharedUserFiles,
  getUserFiles,
  importArchiveFiles,
  shareFile,
  unshareFile,
  uploadFile,
} from "../controllers/files.controller.js";
import { setFileFolder } from "../controllers/folders.controller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const app = new Hono();

app.get("/", authMiddleware, getUserFiles);
app.get("/shared", authMiddleware, getSharedUserFiles);
app.get("/:file_id/download", authMiddleware, downloadFile);
app.delete("/", authMiddleware, batchDeleteUserFiles);
app.delete("/:file_id", authMiddleware, deleteUserFile);
app.post("/upload", authMiddleware, uploadFile);
app.post("/import", authMiddleware, importArchiveFiles);
app.post("/:file_id/share", authMiddleware, shareFile);
app.delete("/:file_id/share", authMiddleware, unshareFile);
app.put("/:file_id/folder", authMiddleware, setFileFolder);

export default app;
