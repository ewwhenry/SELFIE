import jsonwebtoken from "jsonwebtoken";
import { ACCESS_TOKEN_TTL_SECONDS, JWT_SECRET } from "../config.js";
import type { JWTPayload } from "../types/jwt.js";

export const signToken = (userId: string): string => {
  return jsonwebtoken.sign({ sub: userId }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });
};

/**
 * Verify the validity of an access token.
 * @param token The access_token to verify
 * @returns A decoded JWT payload, null if the access_token isn't valid.
 */
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jsonwebtoken.verify(token, JWT_SECRET) as JWTPayload;
  } catch (_error) {
    return null;
  }
};
