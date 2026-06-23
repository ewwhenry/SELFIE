import { Hono } from "hono";
import {
  downloadSharedFile,
  getSharedFile,
} from "../controllers/share.controller.js";

const app = new Hono();

app.get("/:token", getSharedFile);
app.get("/:token/download", downloadSharedFile);

export default app;
