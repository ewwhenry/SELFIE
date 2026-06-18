import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { ARGON2_SECRET } from "../config.js";

const SALT_LEN = 16;
const KEY_LEN = 64;
const ITERATIONS = 16384;
const BLOCK_SIZE = 8;
const PARALLELISM = 1;

export function hashPassword(password: string) {
  const salt = randomBytes(SALT_LEN);

  const derivedKey = scryptSync(
    password,
    Buffer.concat([salt, Buffer.from(ARGON2_SECRET)]),
    KEY_LEN,
    {
      N: ITERATIONS,
      r: BLOCK_SIZE,
      p: PARALLELISM,
    },
  );

  // formato: salt:hash
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

export function verifyPassword(stored: string, password: string) {
  const [saltHex, hashHex] = stored.split(":");

  const salt = Buffer.from(saltHex, "hex");
  const originalHash = Buffer.from(hashHex, "hex");

  const derivedKey = scryptSync(
    password,
    Buffer.concat([salt, Buffer.from(ARGON2_SECRET)]),
    KEY_LEN,
    {
      N: ITERATIONS,
      r: BLOCK_SIZE,
      p: PARALLELISM,
    },
  );

  return timingSafeEqual(originalHash, derivedKey);
}
