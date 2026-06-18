import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import auth from "./routes/auth.route";
import files from "./routes/files.route";
import health from "./routes/health.route";
import users from "./routes/users.route";

const app = new Hono();
app.use(logger());
app.use(
  "*",
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    exposeHeaders: ["Content-Disposition"],
  }),
);

app.route("/health", health);
app.route("/auth", auth);
app.route("/users", users);
app.route("/files", files);

export default app;
