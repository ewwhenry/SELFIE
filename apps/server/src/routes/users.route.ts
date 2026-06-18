import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const app = new Hono();

app.get("/me", authMiddleware, async (c) => {
  const userData = await prisma.user.findFirst({
    where: {
      id: c.get("userId"),
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
    data: {
      id: userData.id,
      role: userData.role,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      quotaBytes: userData.quotaBytes.toString(),
      usedBytes: userData.usedBytes.toString(),
    },
  });
});

export default app;
