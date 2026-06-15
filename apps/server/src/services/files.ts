import fs from "node:fs";
import path from "node:path";
import { STORAGE_PATH } from "../config";

export const save = async (file: File, storedFilename: string) => {
  const filePath = path.join(
    STORAGE_PATH,
    `${storedFilename}.${file.type.split("/")[1]}`,
  );
  await fs.promises.writeFile(filePath, Buffer.from(await file.arrayBuffer()));
  return true;
};

export const deleteFile = async (filePath: string) => {
  await fs.promises.unlink(filePath);
  return true;
};
