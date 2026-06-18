import argon2 from "argon2";
import { ARGON2_SECRET } from "../config.js";

export async function hashPassword(password: string) {
  const hashedPassword = await argon2.hash(password, {
    secret: Buffer.from(ARGON2_SECRET),
  });

  return hashedPassword;
}

export async function verifyPassword(hashedPassword: string, password: string) {
  return await argon2.verify(hashedPassword, password, {
    secret: Buffer.from(ARGON2_SECRET),
  });
}
