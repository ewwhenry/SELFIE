import { getCookie, setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import {
  ACCESS_COOKIE_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from "../config";
import { prisma } from "../lib/prisma";
import { signToken, verifyToken } from "../services/jwt";
import type { JWTPayload } from "../types/jwt";

export const authMiddlewareWithHeader = createMiddleware<{
  Variables: {
    userId: string;
    role: "USER" | "ADMIN";
  };
}>(async (c, next) => {
  const authorizationHeader = c.req.header("Authorization");

  if (!authorizationHeader) {
    c.status(401);
    return c.json({
      message: "Missing Authorization header",
    });
  }

  const accessToken = authorizationHeader.split(" ")[1] as string;
  const verifiedDecodedPayload = verifyToken(accessToken);

  if (!verifiedDecodedPayload) {
    c.status(401);
    return c.json({
      message: "Invalid token",
    });
  }

  const user = await prisma.user.findFirst({
    where: {
      id: verifiedDecodedPayload.sub,
    },
  });

  if (!user) {
    c.status(401);
    return c.json({
      message: "Invalid token",
    });
  }

  c.set("userId", verifiedDecodedPayload.sub);
  c.set("role", user.role);
  await next();
});

export const authMiddleware = createMiddleware<{
  Variables: {
    userId: string;
    role: "USER" | "ADMIN";
  };
}>(async (c, next) => {
  const accessToken = getCookie(c, "access_token");
  const refreshToken = getCookie(c, "refresh_token");
  let verifiedDecodedPayload: JWTPayload | null = null;

  if (!accessToken && refreshToken) {
    console.log("Token expired, trying to generate another one.");
    if (refreshToken) {
      console.log("Refresh token detected.");
      const existantSession = await prisma.session.findFirst({
        where: {
          refreshToken: refreshToken,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!existantSession) {
        c.status(401);
        return c.json({
          message: "Invalid token",
        });
      }

      const user = await prisma.user.findFirst({
        where: {
          id: existantSession.userId,
        },
      });

      if (!user) {
        c.status(400);
        return c.json({
          message: "Invalid token",
        });
      }

      const newAccessToken = signToken(user.id);
      const newRefreshToken = crypto.randomUUID();
      const refreshExpiresAt = new Date(
        Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000,
      );

      await prisma.session.update({
        where: {
          userId: user.id,
          refreshToken: refreshToken,
        },
        data: {
          refreshToken: newRefreshToken,
          expiresAt: refreshExpiresAt,
        },
      });

      setCookie(c, "access_token", newAccessToken, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        maxAge: ACCESS_COOKIE_TTL_SECONDS,
      });
      setCookie(c, "refresh_token", newRefreshToken, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        maxAge: REFRESH_TOKEN_TTL_SECONDS,
      });

      verifiedDecodedPayload = verifyToken(newAccessToken);

      if (!verifiedDecodedPayload) {
        c.status(401);
        return c.json({
          message: "Invalid token",
        });
      }
    } else {
      c.status(401);
      return c.json({
        message: "Invalid token",
      });
    }
  } else if (accessToken) {
    verifiedDecodedPayload = verifyToken(accessToken);
  }

  if (!verifiedDecodedPayload) {
    c.status(401);
    return c.json({
      error: "Invalid token",
    });
  }

  const user = await prisma.user.findFirst({
    where: {
      id: verifiedDecodedPayload.sub,
    },
  });

  if (!user) {
    c.status(401);
    return c.json({
      message: "Invalid token",
    });
  }

  c.set("userId", verifiedDecodedPayload.sub);
  c.set("role", user.role);
  await next();
});
