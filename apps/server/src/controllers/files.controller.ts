import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import type { Context } from "hono";
import { STORAGE_PATH } from "../config";
import type { FileModel } from "../generated/prisma/models";
import { prisma } from "../lib/prisma";
import { deleteFile, save } from "../services/files";
import { validateQuota } from "../services/validators";

type AuthMiddlewareEnv = {
  Variables: {
    userId: string;
  };
};

export const serializeFile = (file: FileModel) => ({
  ...file,
  sizeBytes: file.sizeBytes.toString(),
});

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

      const newDBFile = await prisma.file.create({
        data: {
          userId: c.get("userId"),
          mimeType: file.type,
          storedName: storedFileName,
          originalName: file.name,
          path: storedPath,
          sizeBytes: file.size,
        },
      });

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

    c.header("Content-Length", fileStat.size.toString());
    c.header("Content-Type", file.mimeType.toString());
    c.header(
      "Content-Disposition",
      `attachment; filename="${file.originalName}"`,
    );

    const stream = createReadStream(file.path);

    return new Response(stream);
  } catch (_err) {
    console.log(_err);
  }
};
