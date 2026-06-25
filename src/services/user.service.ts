import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AppError, Errors } from "@/lib/errors";

export async function getAdvertiserSettings(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      referralCode: true,
      createdAt: true,
      advertiserProfile: {
        select: { company: true, industry: true },
      },
    },
  });
}

export async function updateAdvertiserProfile(
  userId: string,
  data: { name: string; company?: string },
) {
  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { name: data.name },
    });

    if (data.company !== undefined) {
      await tx.advertiserProfile.upsert({
        where: { userId },
        create: { userId, company: data.company },
        update: { company: data.company },
      });
    }

    return getAdvertiserSettings(userId);
  });
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user) {
    throw Errors.notFound("User");
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw new AppError("AUTH_INVALID_PASSWORD", "Current password is incorrect", 422);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}
