import { createReadStream } from "node:fs";
import { copyFile, mkdir, mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import AdmZip from "adm-zip";
import tar from "tar-stream";
import { STORAGE_PATH } from "../config.js";
import { prisma } from "../lib/prisma.js";

const MEDIA_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".bmp",
  ".webp",
  ".svg",
  ".heic",
  ".heif",
  ".tiff",
  ".tif",
  ".mp4",
  ".mov",
  ".avi",
  ".mkv",
  ".webm",
  ".m4v",
  ".wmv",
  ".flv",
  ".mpeg",
  ".mpg",
  ".3gp",
]);

export type ImportResult = {
  imported: { originalName: string; id: string }[];
  skipped: string[];
  errors: { file: string; error: string }[];
};

export async function importArchive(
  archivePath: string,
  fileName: string,
  userId: string,
): Promise<ImportResult> {
  const result: ImportResult = { imported: [], skipped: [], errors: [] };
  const tempDir = await mkdtemp(join(tmpdir(), "selfie-import-"));

  try {
    const isZip = /\.zip$/i.test(fileName);
    const isTgz = /\.tar\.gz$/i.test(fileName) || /\.tgz$/i.test(fileName);

    if (isZip) {
      await extractZip(archivePath, tempDir);
    } else if (isTgz) {
      await extractTgz(archivePath, tempDir);
    } else {
      throw new Error("Unsupported archive format. Use .zip or .tar.gz");
    }

    const files = await walkDir(tempDir);
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { quotaBytes: true, usedBytes: true },
    });
    let totalNeeded = 0n;
    const fileStats: { path: string; size: bigint; ext: string }[] = [];

    for (const filePath of files) {
      const ext = extname(filePath).toLowerCase();
      if (!MEDIA_EXTENSIONS.has(ext)) {
        result.skipped.push(basename(filePath));
        continue;
      }
      const s = await stat(filePath);
      fileStats.push({ path: filePath, size: BigInt(s.size), ext });
      totalNeeded += BigInt(s.size);
    }

    if (user.usedBytes + totalNeeded > user.quotaBytes) {
      throw new Error("Storage quota exceeded");
    }

    for (const fs of fileStats) {
      try {
        const storedName = crypto.randomUUID();
        const destPath = join(STORAGE_PATH, `${storedName}${fs.ext}`);
        await copyFile(fs.path, destPath);

        const originalName = basename(fs.path);
        const mimeType = getMimeType(fs.ext);

        const dbFile = await prisma.file.create({
          data: {
            userId,
            originalName,
            storedName,
            mimeType,
            sizeBytes: fs.size,
            path: destPath,
          },
        });

        await prisma.user.update({
          where: { id: userId },
          data: { usedBytes: { increment: fs.size } },
        });

        result.imported.push({ originalName, id: dbFile.id });
      } catch (err) {
        result.errors.push({
          file: basename(fs.path),
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }

  return result;
}

async function extractZip(zipPath: string, dest: string): Promise<void> {
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(dest, true);
}

async function extractTgz(tgzPath: string, dest: string): Promise<void> {
  const extract = tar.extract();
  const gunzip = createGunzip();
  const { createWriteStream } = await import("node:fs");

  let extractError: Error | null = null;
  extract.on("error", (err) => {
    extractError = err;
  });

  const entryPromises: Promise<void>[] = [];

  extract.on("entry", (header, stream, next) => {
    if (header.type === "file" && header.name) {
      const filePath = join(dest, header.name);
      const dir = filePath.substring(0, filePath.lastIndexOf("/"));
      const p = mkdir(dir, { recursive: true }).then(() => {
        return new Promise<void>((resolve, reject) => {
          const ws = createWriteStream(filePath);
          stream.pipe(ws);
          ws.on("finish", resolve);
          ws.on("error", (err) => {
            extractError = err;
            stream.destroy();
            reject(err);
          });
        });
      });
      entryPromises.push(p);
    }
    stream.on("end", next);
    stream.resume();
  });

  await pipeline(createReadStream(tgzPath), gunzip, extract);
  await Promise.all(entryPromises);

  if (extractError) throw extractError;
}

async function walkDir(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkDir(fullPath)));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".bmp": "image/bmp",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".heic": "image/heic",
    ".heif": "image/heif",
    ".tiff": "image/tiff",
    ".tif": "image/tiff",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".avi": "video/x-msvideo",
    ".mkv": "video/x-matroska",
    ".webm": "video/webm",
    ".m4v": "video/x-m4v",
    ".wmv": "video/x-ms-wmv",
    ".flv": "video/x-flv",
    ".mpeg": "video/mpeg",
    ".mpg": "video/mpeg",
    ".3gp": "video/3gpp",
  };
  return map[ext] || "application/octet-stream";
}
