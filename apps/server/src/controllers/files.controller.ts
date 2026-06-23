import { createReadStream } from "node:fs";
import { stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Context } from "hono";
import { stream } from "hono/streaming";
import { STORAGE_PATH, MAX_IMPORT_SIZE } from "../config.js";
import { prisma } from "../lib/prisma.js";
import { deleteFile, save } from "../services/files.js";
import { validateQuota } from "../services/validators.js";
import { importArchive } from "../services/importer.js";

type AuthMiddlewareEnv = {
  Variables: {
    userId: string;
  };
};

export const serializeFile = (file) => ({
  ...file,
  sizeBytes: file.sizeBytes.toString(),
  shareExpiresAt: file.shareExpiresAt?.toISOString() ?? null,
});

export const importArchiveFiles = async (c: Context<AuthMiddlewareEnv>) => {
  const contentLength = Number(c.req.header("Content-Length"));
  if (contentLength > MAX_IMPORT_SIZE) {
    c.status(413);
    return c.json({ error: "Archive too large. Maximum size is 500 MB" });
  }

  const buf = await c.req.raw.arrayBuffer();
  if (!buf || buf.byteLength === 0) {
    c.status(400);
    return c.json({ error: "Archive file is required" });
  }

  if (buf.byteLength > MAX_IMPORT_SIZE) {
    c.status(413);
    return c.json({ error: "Archive too large. Maximum size is 500 MB" });
  }

  const filename = decodeURIComponent(c.req.header("X-Filename") || "archive.zip");
  const ext = filename.toLowerCase();
  if (!ext.endsWith(".zip") && !ext.endsWith(".tar.gz") && !ext.endsWith(".tgz")) {
    c.status(400);
    return c.json({ error: "Unsupported format. Upload a .zip or .tar.gz file" });
  }

  const tempPath = path.join(STORAGE_PATH, `_import_${crypto.randomUUID()}`);
  await writeFile(tempPath, Buffer.from(buf));

  try {
    const result = await importArchive(tempPath, filename, c.get("userId"));

    c.status(200);
    return c.json({
      message: `Imported ${result.imported.length} files`,
      data: result,
    });
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOSPC") {
      c.status(507);
      return c.json({ error: "Insufficient storage space" });
    }
    throw err;
  } finally {
    await unlink(tempPath).catch(() => {});
  }
};

export const getSharedUserFiles = async (c: Context<AuthMiddlewareEnv>) => {
  const files = await prisma.file.findMany({
    where: {
      userId: c.get("userId"),
      shareToken: { not: null },
    },
    orderBy: { createdAt: "desc" },
  });

  c.status(200);
  return c.json({
    message: "success",
    data: files.map((f) => serializeFile(f)),
  });
};

export const uploadFile = async (c: Context<AuthMiddlewareEnv>) => {
  try {
    const body = await c.req.parseBody();
    const file = body.file;

    if (file instanceof File) {
      try {
        await validateQuota(c.get("userId"), BigInt(file.size));
      } catch (_err) {
        c.status(403);
        return c.json({ error: "Quota exceeded, please try again" });
      }

      c.status(200);
      const storedFileName = crypto.randomUUID();
      const successfullySaved = await save(file, storedFileName);

      if (!successfullySaved) {
        c.status(500);
        return c.json({
          error: "File could not be saved successfully, please try again",
        });
      }

      const storedPath = path.join(
        STORAGE_PATH,
        `${storedFileName}.${file.type.split("/")[1]}`,
      );

      const [newDBFile] = await prisma.$transaction([
        prisma.file.create({
          data: {
            userId: c.get("userId"),
            mimeType: file.type,
            storedName: storedFileName,
            originalName: file.name,
            path: storedPath,
            sizeBytes: file.size,
          },
        }),
        prisma.user.update({
          where: {
            id: c.get("userId"),
          },
          data: {
            usedBytes: {
              increment: file.size,
            },
          },
        }),
      ]);

      return c.json({
        message: "File uploaded",
        data: serializeFile(newDBFile),
      });
    } else {
      c.status(400);
      return c.json({
        error: "Invalid file",
      });
    }
  } catch (_err) {
    console.log(_err);
    c.status(400);
    return c.json({
      error: "Missing body in request",
    });
  }
};

export const getUserFiles = async (c: Context<AuthMiddlewareEnv>) => {
  try {
    const { cursor, limit } = c.req.query();

    const files = await prisma.file.findMany({
      where: {
        userId: c.get("userId"),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: Number(limit) || 10,
      ...(cursor && {
        skip: 1,
        cursor: {
          id: cursor,
        },
      }),
    });

    c.status(200);
    return c.json({
      message: "success.",
      data: files.map((file) => serializeFile(file)),
      next_cursor: files.pop()?.id,
    });
  } catch (_err) {
    console.log(_err);
    c.status(500);
    return c.json({
      error:
        "An error ocurred while we were trying to get your files, please try again later",
    });
  }
};

export const batchDeleteUserFiles = async (c: Context<AuthMiddlewareEnv>) => {
  try {
    const ids = await c.req.json();

    const files = await prisma.file.findMany({
      where: {
        id: { in: ids },
        userId: c.get("userId"),
      },
    });

    const deletedFiles = await prisma.file.deleteMany({
      where: {
        id: { in: ids },
        userId: c.get("userId"),
      },
    });

    const totalSize = files.reduce((acc, file) => acc + file.sizeBytes, 0n);

    await prisma.user.update({
      where: {
        id: c.get("userId"),
      },
      data: {
        usedBytes: {
          decrement: totalSize,
        },
      },
    });

    for (const file of files) {
      try {
        await deleteFile(file.path);
        console.log(`Deleted file ${file.path}`);
      } catch (err) {
        console.error(`Failed to delete physical file: ${file.path}`, err);
      }
    }

    c.status(200);
    return c.json({
      message: `${deletedFiles.count} files deleted successfully.`,
    });
  } catch (err) {
    console.error(err);

    c.status(500);
    return c.json({
      message: "Failed to delete files.",
    });
  }
};

export const deleteUserFile = async (c: Context<AuthMiddlewareEnv>) => {
  try {
    const file_id = c.req.param("file_id");
    if (!file_id) {
      c.status(400);
      return c.json({ message: "File ID is required." });
    }

    const file = await prisma.file.findFirst({
      where: {
        id: file_id,
        userId: c.get("userId"),
      },
    });

    if (!file) {
      c.status(404);
      return c.json({
        error: "File not found.",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.file.delete({
        where: {
          id: file_id,
          userId: c.get("userId"),
        },
      });

      await tx.user.update({
        where: { id: c.get("userId") },
        data: {
          usedBytes: {
            decrement: file.sizeBytes,
          },
        },
      });

      await deleteFile(file.path);
    });

    c.status(200);
    return c.json({
      message: "File deleted successfully",
    });
  } catch (_err) {
    c.status(500);
    return c.json({
      error: "Internal server error",
    });
  }
};

export const downloadFile = async (c: Context<AuthMiddlewareEnv>) => {
  try {
    const fileId = c.req.param("file_id");
    if (!fileId) {
      c.status(400);
      return c.json({ message: "File ID is required." });
    }

    const file = await prisma.file.findUnique({
      where: { id: fileId, userId: c.get("userId") },
    });

    if (!file) {
      c.status(404);
      return c.json({
        error: "File not found.",
      });
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
  } catch (_err) {
    console.log(_err);
  }
};

export const shareFile = async (c: Context<AuthMiddlewareEnv>) => {
  const fileId = c.req.param("file_id");
  if (!fileId) {
    c.status(400);
    return c.json({ error: "File ID is required." });
  }

  const file = await prisma.file.findFirst({
    where: { id: fileId, userId: c.get("userId") },
  });

  if (!file) {
    c.status(404);
    return c.json({ error: "File not found." });
  }

  if (file.shareToken) {
    return c.json({ message: "File already shared", data: serializeFile(file) });
  }

  const { ttlDays } = await c.req.json().catch(() => ({}));
  const shareToken = crypto.randomUUID();
  const shareExpiresAt = ttlDays
    ? new Date(Date.now() + Number(ttlDays) * 86400000)
    : null;

  const updated = await prisma.file.update({
    where: { id: fileId },
    data: { shareToken, shareExpiresAt },
  });

  c.status(200);
  return c.json({ message: "File shared", data: serializeFile(updated) });
};

export const unshareFile = async (c: Context<AuthMiddlewareEnv>) => {
  const fileId = c.req.param("file_id");
  if (!fileId) {
    c.status(400);
    return c.json({ error: "File ID is required." });
  }

  const file = await prisma.file.findFirst({
    where: { id: fileId, userId: c.get("userId") },
  });

  if (!file) {
    c.status(404);
    return c.json({ error: "File not found." });
  }

  const updated = await prisma.file.update({
    where: { id: fileId },
    data: { shareToken: null, shareExpiresAt: null },
  });

  c.status(200);
  return c.json({ message: "Share link removed", data: serializeFile(updated) });
};
