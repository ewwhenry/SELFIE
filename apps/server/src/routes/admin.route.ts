import { Hono } from "hono";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { deleteFile } from "../services/files.js";

const app = new Hono();

app.get("/users", authMiddleware, requireAdmin, async (c) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { files: true } } },
  });

  const data = users.map((u) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    role: u.role,
    quotaBytes: u.quotaBytes.toString(),
    usedBytes: u.usedBytes.toString(),
    fileCount: u._count.files,
    createdAt: u.createdAt.toISOString(),
  }));

  return c.json({ data });
});

app.get("/stats", authMiddleware, requireAdmin, async (c) => {
  const [userCount, fileCount, totalSize] = await Promise.all([
    prisma.user.count(),
    prisma.file.count(),
    prisma.file.aggregate({ _sum: { sizeBytes: true } }),
  ]);

  return c.json({
    data: {
      userCount,
      fileCount,
      totalStorageBytes: totalSize._sum.sizeBytes?.toString() ?? "0",
    },
  });
});

app.patch("/users/:id", authMiddleware, requireAdmin, async (c) => {
  const targetId = c.req.param("id");
  const body = await c.req.json();

  const updateData: Record<string, string | bigint> = {};

  if (body.role !== undefined) {
    if (body.role !== "USER" && body.role !== "ADMIN") {
      c.status(400);
      return c.json({ message: "Role must be USER or ADMIN" });
    }
    if (targetId === c.get("userId") && body.role !== "ADMIN") {
      c.status(403);
      return c.json({ message: "Cannot remove your own ADMIN role" });
    }
    updateData.role = body.role;
  }

  if (body.quotaBytes !== undefined) {
    const quota = BigInt(body.quotaBytes);
    if (quota < 0) {
      c.status(400);
      return c.json({ message: "Quota must be non-negative" });
    }
    updateData.quotaBytes = quota;
  }

  if (Object.keys(updateData).length === 0) {
    c.status(400);
    return c.json({ message: "No fields to update" });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: targetId },
      data: updateData,
      include: { _count: { select: { files: true } } },
    });

    return c.json({
      data: {
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        role: updated.role,
        quotaBytes: updated.quotaBytes.toString(),
        usedBytes: updated.usedBytes.toString(),
        fileCount: updated._count.files,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        c.status(404);
        return c.json({ message: "User not found" });
      }
    }
    throw error;
  }
});

app.delete("/users/:id", authMiddleware, requireAdmin, async (c) => {
  const targetId = c.req.param("id");

  const user = await prisma.user.findUnique({
    where: { id: targetId },
    include: { files: { select: { id: true, path: true, sizeBytes: true } } },
  });

  if (!user) {
    c.status(404);
    return c.json({ message: "User not found" });
  }

  const totalSize = user.files.reduce((acc, f) => acc + f.sizeBytes, 0n);

  await prisma.$transaction(async (tx) => {
    await tx.file.deleteMany({ where: { userId: targetId } });
    await tx.session.deleteMany({ where: { userId: targetId } });
    await tx.user.delete({ where: { id: targetId } });

    await tx.user.update({
      where: { id: c.get("userId") },
      data: { usedBytes: { decrement: totalSize } },
    });
  });

  for (const file of user.files) {
    try {
      await deleteFile(file.path);
    } catch {
      // file may already be missing on disk
    }
  }

  return c.json({ message: "User deleted" });
});

export default app;
