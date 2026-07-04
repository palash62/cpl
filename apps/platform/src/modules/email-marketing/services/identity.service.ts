import type { Prisma } from "@prisma/client";
import {
  SESv2Client,
  CreateEmailIdentityCommand,
  GetEmailIdentityCommand,
} from "@aws-sdk/client-sesv2";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { getResolvedSesConfig } from "@/services/ses-settings.service";

function getSesClient(config: Awaited<ReturnType<typeof getResolvedSesConfig>>) {
  return new SESv2Client({
    region: config.region,
    credentials:
      config.accessKeyId && config.secretAccessKey
        ? {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          }
        : undefined,
  });
}

export async function listSendingIdentities(advertiserId: string) {
  return prisma.advertiserSendingIdentity.findMany({
    where: { advertiserId },
    orderBy: { createdAt: "desc" },
  });
}

export async function requestDomainVerification(advertiserId: string, domain: string, fromName: string) {
  const config = await getResolvedSesConfig();
  if (!config.enabled) {
    throw new AppError("SES_NOT_CONFIGURED", "SES is not configured by platform admin", 503);
  }

  const fromEmail = `noreply@${domain}`;
  const client = getSesClient(config);

  try {
    const result = await client.send(
      new CreateEmailIdentityCommand({
        EmailIdentity: domain,
        DkimSigningAttributes: { NextSigningKeyLength: "RSA_2048_BIT" },
      }),
    );

    const dkimTokens = result.DkimAttributes?.Tokens ?? [];

    const existing = await prisma.advertiserSendingIdentity.findUnique({
      where: { advertiserId_domain: { advertiserId, domain } },
    });

    if (existing) {
      return prisma.advertiserSendingIdentity.update({
        where: { id: existing.id },
        data: {
          dkimTokens,
          verificationStatus: "PENDING",
        },
      });
    }

    const count = await prisma.advertiserSendingIdentity.count({ where: { advertiserId } });

    return prisma.advertiserSendingIdentity.create({
      data: {
        advertiserId,
        domain,
        fromEmail,
        fromName,
        dkimTokens,
        verificationStatus: "PENDING",
        isDefault: count === 0,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Domain verification failed";
    throw new AppError("SES_ERROR", message, 502);
  }
}

export async function refreshDomainVerification(advertiserId: string, identityId: string) {
  const identity = await prisma.advertiserSendingIdentity.findFirst({
    where: { id: identityId, advertiserId },
  });
  if (!identity) throw new AppError("NOT_FOUND", "Sending identity not found", 404);

  const config = await getResolvedSesConfig();
  const client = getSesClient(config);

  try {
    const result = await client.send(
      new GetEmailIdentityCommand({ EmailIdentity: identity.domain }),
    );

    const verified = result.VerifiedForSendingStatus === true;
    return prisma.advertiserSendingIdentity.update({
      where: { id: identityId },
      data: {
        verificationStatus: verified ? "VERIFIED" : "PENDING",
        dkimTokens: (result.DkimAttributes?.Tokens ?? identity.dkimTokens) as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification check failed";
    throw new AppError("SES_ERROR", message, 502);
  }
}

export async function setDefaultIdentity(advertiserId: string, identityId: string) {
  const identity = await prisma.advertiserSendingIdentity.findFirst({
    where: { id: identityId, advertiserId, verificationStatus: "VERIFIED" },
  });
  if (!identity) throw new AppError("NOT_FOUND", "Verified identity not found", 404);

  await prisma.advertiserSendingIdentity.updateMany({
    where: { advertiserId },
    data: { isDefault: false },
  });

  return prisma.advertiserSendingIdentity.update({
    where: { id: identityId },
    data: { isDefault: true },
  });
}
