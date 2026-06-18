import { Hono } from "hono";
import { login, refresh, register } from "../controllers/auth.controller.js";

const app = new Hono();

app.post("/register", register);
app.post("/refresh", refresh);
app.post("/login", login);

export default app;
