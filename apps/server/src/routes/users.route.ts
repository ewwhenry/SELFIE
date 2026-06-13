import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/authMiddleware";

const app = new Hono();

app.get("/me", authMiddleware, async (c) => {
  const userData = await prisma.user.findFirst({
    where: {
      id: c.var.userId,
    },
  });

  if (!userData) {
    c.status(404);
    return c.json({
      message: "User not found",
    });
  }

  c.status(200);
  return c.json({
    message: "Authentication successful",
    user_data: {
      id: userData.id,
      role: userData.role,
      email: userData.email,
    },
  });
});

export default app;
