import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import type { Context } from "hono";
import { stream } from "hono/streaming";
import { prisma } from "../lib/prisma.js";

export const getSharedFile = async (c: Context) => {
  const token = c.req.param("token");

  const file = await prisma.file.findUnique({
    where: { shareToken: token },
  });

  if (!file) {
    c.status(404);
    return c.json({ error: "File not found or share link is invalid." });
  }

  if (file.shareExpiresAt && file.shareExpiresAt < new Date()) {
    c.status(410);
    return c.json({ error: "Share link has expired." });
  }

  c.status(200);
  return c.json({
    message: "success",
    data: {
      id: file.id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes.toString(),
      createdAt: file.createdAt.toISOString(),
    },
  });
};

export const downloadSharedFile = async (c: Context) => {
  const token = c.req.param("token");

  const file = await prisma.file.findUnique({
    where: { shareToken: token },
  });

  if (!file) {
    c.status(404);
    return c.json({ error: "File not found or share link is invalid." });
  }

  if (file.shareExpiresAt && file.shareExpiresAt < new Date()) {
    c.status(410);
    return c.json({ error: "Share link has expired." });
  }

  const fileStat = await stat(file.path);
  const encodedFilename = encodeURIComponent(file.originalName);

  c.header("Content-Length", fileStat.size.toString());
  c.header("Content-Type", file.mimeType);
  c.header(
    "Content-Disposition",
    `attachment; filename="download"; filename*=UTF-8''${encodedFilename}`,
  );

  return stream(c, async (s) => {
    const nodeStream = createReadStream(file.path);
    for await (const chunk of nodeStream) {
      await s.write(chunk);
    }
  });
};
