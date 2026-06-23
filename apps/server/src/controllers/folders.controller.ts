import type { Context } from "hono";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

type AuthEnv = {
  Variables: {
    userId: string;
  };
};

export const getFolders = async (c: Context<AuthEnv>) => {
  const folders = await prisma.folder.findMany({
    where: { userId: c.get("userId") },
    include: { _count: { select: { files: true } } },
    orderBy: { name: "asc" },
  });

  c.status(200);
  return c.json({ data: folders, message: "success" });
};

export const createFolder = async (c: Context<AuthEnv>) => {
  const { name, parentId } = await c.req.json();

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    c.status(400);
    return c.json({ error: "Folder name is required" });
  }

  if (parentId) {
    const parent = await prisma.folder.findFirst({
      where: { id: parentId, userId: c.get("userId") },
    });
    if (!parent) {
      c.status(404);
      return c.json({ error: "Parent folder not found" });
    }
  }

  try {
    const folder = await prisma.folder.create({
      data: {
        name: name.trim(),
        userId: c.get("userId"),
        parentId: parentId || null,
      },
    });

    c.status(201);
    return c.json({ data: { ...folder, _count: { files: 0 } }, message: "Folder created" });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        c.status(409);
        return c.json({ error: "A folder with this name already exists here" });
      }
    }
    throw err;
  }
};

export const updateFolder = async (c: Context<AuthEnv>) => {
  const folderId = c.req.param("folder_id");
  const { name } = await c.req.json();

  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId: c.get("userId") },
  });

  if (!folder) {
    c.status(404);
    return c.json({ error: "Folder not found" });
  }

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    c.status(400);
    return c.json({ error: "Folder name is required" });
  }

  try {
    const updated = await prisma.folder.update({
      where: { id: folderId },
      data: { name: name.trim() },
    });

    c.status(200);
    return c.json({ data: updated, message: "Folder renamed" });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        c.status(409);
        return c.json({ error: "A folder with this name already exists here" });
      }
    }
    throw err;
  }
};

export const deleteFolder = async (c: Context<AuthEnv>) => {
  const folderId = c.req.param("folder_id");

  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId: c.get("userId") },
  });

  if (!folder) {
    c.status(404);
    return c.json({ error: "Folder not found" });
  }

  await prisma.$transaction(async (tx) => {
    // Move files to root
    await tx.file.updateMany({
      where: { folderId },
      data: { folderId: null },
    });

    // Move child folders to root
    await tx.folder.updateMany({
      where: { parentId: folderId },
      data: { parentId: null },
    });

    await tx.folder.delete({ where: { id: folderId } });
  });

  c.status(200);
  return c.json({ message: "Folder deleted" });
};

export const setFileFolder = async (c: Context<AuthEnv>) => {
  const fileId = c.req.param("file_id");
  const { folderId } = await c.req.json();

  const file = await prisma.file.findFirst({
    where: { id: fileId, userId: c.get("userId") },
  });

  if (!file) {
    c.status(404);
    return c.json({ error: "File not found" });
  }

  if (folderId) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId: c.get("userId") },
    });

    if (!folder) {
      c.status(404);
      return c.json({ error: "Folder not found" });
    }
  }

  const updated = await prisma.file.update({
    where: { id: fileId },
    data: { folderId: folderId || null },
  });

  const { serializeFile } = await import("./files.controller.js");

  c.status(200);
  return c.json({ message: "File moved", data: serializeFile(updated) });
};
