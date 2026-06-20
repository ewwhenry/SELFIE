import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { ALLOWED_ORIGINS } from "./config.js";
import admin from "./routes/admin.route.js";
import auth from "./routes/auth.route.js";
import files from "./routes/files.route.js";
import health from "./routes/health.route.js";
import users from "./routes/users.route.js";

const app = new Hono();
app.use(logger());
app.use(
  "*",
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
    exposeHeaders: ["Content-Disposition"],
  }),
);

app.route("/health", health);
app.route("/auth", auth);
app.route("/users", users);
app.route("/files", files);
app.route("/admin", admin);

export default app;
