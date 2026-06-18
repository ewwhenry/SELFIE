import { setCookie } from "hono/cookie";
import type { Handler } from "hono/types";
import {
  ACCESS_COOKIE_TTL_SECONDS,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from "../config";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword } from "../services/crypto";
import { signToken } from "../services/jwt";

export const register: Handler = async (c) => {
  try {
    const body = await c.req.json();

    if (!body.email || !body.password) {
      c.status(400);
      return c.json({
        message: "Missing required fields",
      });
    }

    if (!body.email || !body.password || !body.first_name || !body.last_name) {
      c.status(400);
      return c.json({ error: "Missing required fields." });
    }

    const hashedPassword = await hashPassword(body.password);

    try {
      const newUser = await prisma.user.create({
        data: {
          email: body.email,
          firstName: body.first_name,
          lastName: body.last_name,
          passwordHash: hashedPassword,
          role: "USER",
        },
      });

      const accessToken = signToken(newUser.id);
      const refreshToken = crypto.randomUUID();
      const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await prisma.session.create({
        data: {
          refreshToken,
          expiresAt: refreshExpiresAt,
          userId: newUser.id,
        },
      });

      return c.json({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          c.status(409);
          return c.json({
            message: "Duplicated user in database",
          });
        }
      }
    }
  } catch (_error) {
    c.status(500);
    return c.json({
      message: "Missing body in request",
    });
  }
};

export const refresh: Handler = async (c) => {
  try {
    const { refresh_token } = await c.req.json();

    const existantSession = await prisma.session.findFirst({
      where: {
        refreshToken: refresh_token,
      },
    });

    if (!existantSession) {
      c.status(400);
      return c.json({
        message: "Invalid or revoked refresh token.",
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
        message: "Invalid or revoked refresh token.",
      });
    }

    const accessToken = signToken(user.id);
    const refreshToken = crypto.randomUUID();
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.session.update({
      where: {
        userId: user.id,
        refreshToken: refresh_token,
      },
      data: {
        refreshToken,
        expiresAt: refreshExpiresAt,
      },
    });

    c.status(200);
    return c.json({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch (_error) {
    c.status(500);
    return c.json({
      message: "Missing body in request",
    });
  }
};

export const login: Handler = async (c) => {
  try {
    const { email, password } = await c.req.json();

    const user = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      c.status(401);
      return c.json({
        message: "Invalid credentials",
      });
    }

    const passwordMatch = await verifyPassword(user.passwordHash, password);

    if (!passwordMatch) {
      c.status(401);
      return c.json({
        message: "Invalid credentials",
      });
    }

    const accessToken = signToken(user.id);
    const refreshToken = crypto.randomUUID();
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        expiresAt: refreshExpiresAt,
        refreshToken,
        userId: user.id,
      },
    });

    setCookie(c, "access_token", accessToken, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      maxAge: ACCESS_COOKIE_TTL_SECONDS,
    });

    setCookie(c, "refresh_token", refreshToken, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      maxAge: REFRESH_TOKEN_TTL_SECONDS,
    });

    c.status(200);
    return c.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      message: "Login success",
    });
  } catch (_error) {
    c.status(500);
    return c.json({
      message: "Missing body in request",
    });
  }
};
