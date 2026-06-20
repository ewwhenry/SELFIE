import { Hono } from "hono";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { hashPassword, verifyPassword } from "../services/crypto.js";

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

app.patch("/me", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();

  const updateData: Record<string, string> = {};

  if (body.firstName !== undefined) updateData.firstName = body.firstName;
  if (body.lastName !== undefined) updateData.lastName = body.lastName;
  if (body.email !== undefined) updateData.email = body.email;

  if (Object.keys(updateData).length === 0) {
    c.status(400);
    return c.json({ message: "No fields to update" });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    c.status(200);
    return c.json({
      message: "Profile updated",
      data: {
        id: updatedUser.id,
        role: updatedUser.role,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        quotaBytes: updatedUser.quotaBytes.toString(),
        usedBytes: updatedUser.usedBytes.toString(),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        c.status(409);
        return c.json({ message: "Email already in use" });
      }
    }
    throw error;
  }
});

app.patch("/me/password", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const { currentPassword, newPassword } = await c.req.json();

  if (!currentPassword || !newPassword) {
    c.status(400);
    return c.json({
      message: "Current password and new password are required",
    });
  }

  if (newPassword.length < 6) {
    c.status(400);
    return c.json({ message: "New password must be at least 6 characters" });
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const match = verifyPassword(user.passwordHash, currentPassword);
  if (!match) {
    c.status(401);
    return c.json({ message: "Current password is incorrect" });
  }

  const newHash = hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  c.status(200);
  return c.json({ message: "Password updated" });
});

export default app;
