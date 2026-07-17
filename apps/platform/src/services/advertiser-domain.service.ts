import dns from "node:dns/promises";
import { prisma } from "@/lib/prisma";
import { Errors } from "@/lib/errors";
import { getPlatformHost, isPlatformHost } from "@/lib/platform-host";

export type AdvertiserDomainStatus = "PENDING" | "VERIFIED" | "FAILED";

function normalizeDomainInput(value: string): string {
  let domain = value.trim().toLowerCase();
  domain = domain.replace(/^https?:\/\//, "");
  domain = domain.replace(/\/.*$/, "");
  domain = domain.replace(/:\d+$/, "");
  domain = domain.replace(/\.$/, "");
  return domain;
}

function isValidDomain(domain: string): boolean {
  if (!domain || domain.length > 253) return false;
  if (domain.includes("..")) return false;
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain);
}

async function dnsPointsToPlatform(domain: string, platformHost: string): Promise<boolean> {
  const target = platformHost.toLowerCase();

  try {
    const cnames = await dns.resolveCname(domain);
    if (
      cnames.some(
        (record) =>
          record.toLowerCase() === target || record.toLowerCase().endsWith(`.${target}`),
      )
    ) {
      return true;
    }
  } catch {
    // fall through to A-record check
  }

  try {
    const [domainIps, platformIps] = await Promise.all([
      dns.resolve4(domain),
      dns.resolve4(target),
    ]);
    return domainIps.some((ip) => platformIps.includes(ip));
  } catch {
    return false;
  }
}

export async function listAdvertiserDomains(advertiserId: string) {
  return prisma.advertiserDomain.findMany({
    where: { advertiserId },
    include: {
      funnels: {
        select: { id: true, name: true, slug: true, status: true },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function addAdvertiserDomain(advertiserId: string, rawDomain: string) {
  const domain = normalizeDomainInput(rawDomain);
  if (!isValidDomain(domain)) {
    throw Errors.validation("Enter a valid domain like www.example.com");
  }
  if (isPlatformHost(domain)) {
    throw Errors.validation("You cannot use the platform domain as a custom domain.");
  }

  const existing = await prisma.advertiserDomain.findUnique({ where: { domain } });
  if (existing && existing.advertiserId !== advertiserId) {
    throw Errors.validation("This domain is already connected to another account.");
  }

  return prisma.advertiserDomain.upsert({
    where: { domain },
    create: { advertiserId, domain, status: "PENDING" },
    update: { advertiserId, status: "PENDING", verifiedAt: null },
    include: {
      funnels: {
        select: { id: true, name: true, slug: true, status: true },
        take: 1,
      },
    },
  });
}

export async function removeAdvertiserDomain(advertiserId: string, domainId: string) {
  const record = await prisma.advertiserDomain.findFirst({
    where: { id: domainId, advertiserId },
  });
  if (!record) throw Errors.notFound("Domain");

  await prisma.$transaction([
    prisma.advertiserOptinPage.updateMany({
      where: { customDomainId: domainId },
      data: { customDomainId: null },
    }),
    prisma.advertiserDomain.delete({ where: { id: domainId } }),
  ]);

  return { ok: true };
}

export async function verifyAdvertiserDomain(advertiserId: string, domainId: string) {
  const record = await prisma.advertiserDomain.findFirst({
    where: { id: domainId, advertiserId },
  });
  if (!record) throw Errors.notFound("Domain");

  const platformHost = getPlatformHost();
  const verified = await dnsPointsToPlatform(record.domain, platformHost);
  const now = new Date();

  return prisma.advertiserDomain.update({
    where: { id: domainId },
    data: {
      status: verified ? "VERIFIED" : "FAILED",
      verifiedAt: verified ? now : null,
      lastCheckedAt: now,
    },
    include: {
      funnels: {
        select: { id: true, name: true, slug: true, status: true },
        take: 1,
      },
    },
  });
}

export async function resolveFunnelByDomain(host: string) {
  const normalized = normalizeDomainInput(host);
  const domain = await prisma.advertiserDomain.findFirst({
    where: { domain: normalized, status: "VERIFIED" },
    include: {
      funnels: {
        where: { status: "PUBLISHED" },
        select: { id: true, slug: true, advertiserId: true },
        take: 1,
      },
    },
  });

  const funnel = domain?.funnels[0];
  if (!domain || !funnel) return null;

  return { domain, funnel };
}

export async function assertVerifiedDomainForAdvertiser(
  advertiserId: string,
  customDomainId: string | null | undefined,
) {
  if (!customDomainId) return null;

  const domain = await prisma.advertiserDomain.findFirst({
    where: { id: customDomainId, advertiserId, status: "VERIFIED" },
  });
  if (!domain) {
    throw Errors.validation("Select a verified custom domain or use the default platform domain.");
  }

  await prisma.advertiserOptinPage.updateMany({
    where: {
      customDomainId: domain.id,
      advertiserId,
    },
    data: { customDomainId: null },
  });

  return domain;
}
