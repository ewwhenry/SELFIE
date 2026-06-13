import { createMiddleware } from "hono/factory";
import { prisma } from "../lib/prisma";
import { verifyToken } from "../services/jwt";

export const authMiddleware = createMiddleware<{
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
