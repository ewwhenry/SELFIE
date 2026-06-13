import { Hono } from "hono";
import { logger } from "hono/logger";
import auth from "./routes/auth.route";
import files from "./routes/files.route";
import health from "./routes/health.route";
import users from "./routes/users.route";

const app = new Hono();
app.use(logger());

app.route("/health", health);
app.route("/auth", auth);
app.route("/users", users);
app.route("/files", files);

export default app;
