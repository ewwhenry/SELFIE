import { Hono } from "hono";
import { getUserFiles, upload } from "../controllers/files.controller";
import { authMiddleware } from "../middleware/authMiddleware";

const app = new Hono();

app.get("/", authMiddleware, getUserFiles);
app.post("/upload", authMiddleware, upload);

export default app;
