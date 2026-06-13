import path from "node:path";
import type { Context } from "hono";
import { STORAGE_PATH } from "../config";
import type { FileModel } from "../generated/prisma/models";
import { prisma } from "../lib/prisma";
import { save } from "../services/files";

type AuthMiddlewareEnv = {
  Variables: {
    userId: string;
  };
};

export const serializeFile = (file: FileModel) => ({
  ...file,
  sizeBytes: file.sizeBytes.toString(),
});

export const upload = async (c: Context<AuthMiddlewareEnv>) => {
  try {
    const body = await c.req.parseBody();
    const file = body.file;

    if (file instanceof File) {
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
    const files = await prisma.file.findMany({
      where: {
        userId: c.get("userId"),
      },
    });

    c.status(200);
    return c.json({
      data: files.map((file) => serializeFile(file)),
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
