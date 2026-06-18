import { prisma } from "../lib/prisma.js";

export async function validateQuota(userId: string, incomingSize: bigint) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      quotaBytes: true,
      usedBytes: true,
    },
  });

  if (user.usedBytes + incomingSize > user.quotaBytes) {
    throw new Error("Storage quota exceeded");
  }

  return user;
}
