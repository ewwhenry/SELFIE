import { createMiddleware } from "hono/factory";

export const requireAdmin = createMiddleware<{
  Variables: {
    userId: string;
    role: string;
  };
}>(async (c, next) => {
  if (c.var.role !== "ADMIN") {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
});
