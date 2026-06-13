import { Hono } from "hono";
import { prisma } from "../lib/prisma";

const app = new Hono();

app.get("/", (c) =>
  c.json({
    message: "API is UP",
  }),
);

app.get("/db", async (c) => {
  try {
    const now = Date.now();
    const result = (await prisma.$queryRaw`SELECT NOW()`) as { now: string }[];
    if (result?.[0]?.now) {
      return c.json({
        message: "Database is UP",
        response_time: `${Date.now() - now}ms`,
      });
    }
  } catch (_e) {
    return c.json({ error: "Failed to fetch database" });
  }
});

export default app;
