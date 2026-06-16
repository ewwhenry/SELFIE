import path from "node:path";
import { config } from "dotenv";

config({
  path: ".env",
  quiet: true,
});

export const PORT = Number(process.env.PORT) || 3001;
export const ARGON2_SECRET = process.env.ARGON2_SECRET || "your_argon2_secret";
export const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
export const STORAGE_DIR = process.env.STORAGE_DIR || "./uploads";
export const STORAGE_PATH = path.resolve(STORAGE_DIR);

export const ACCESS_TOKEN_TTL_SECONDS = 60 * 15;
export const ACCESS_COOKIE_TTL_SECONDS = ACCESS_TOKEN_TTL_SECONDS - 30;
export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;
