import { randomBytes } from "node:crypto";
import type { CpaOffer, CpaOfferStatus, Prisma } from "@prisma/client";
import { buildCpaOfferPostbackUrl } from "@cpl/shared";
import { prisma } from "@/lib/prisma";
import { Errors } from "@/lib/errors";

export type SerializedCpaOffer = {
  id: string;
  name: string;
  network: string;
  category: string;
  country: string;
  previewUrl: string;
  trackingUrl: string;
  payout: string;
  status: CpaOfferStatus;
  postbackToken: string;
  postbackUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type CpaOfferListResult = {
  items: SerializedCpaOffer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CpaOfferListFilters = {
  q?: string;
  status?: CpaOfferStatus | "ALL";
  network?: string;
  category?: string;
  country?: string;
  page?: number;
  limit?: number;
};

function decimalToString(value: { toString(): string } | number | string) {
  return typeof value === "string" ? value : value.toString();
}

export function serializeCpaOffer(row: CpaOffer): SerializedCpaOffer {
  return {
    id: row.id,
    name: row.name,
    network: row.network,
    category: row.category,
    country: row.country,
    previewUrl: row.previewUrl,
    trackingUrl: row.trackingUrl,
    payout: decimalToString(row.payout),
    status: row.status,
    postbackToken: row.postbackToken,
    postbackUrl: buildCpaOfferPostbackUrl(row.postbackToken),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function buildWhere(
  filters: CpaOfferListFilters,
  options?: { activeOnly?: boolean },
): Prisma.CpaOfferWhereInput {
  const where: Prisma.CpaOfferWhereInput = {};

  if (options?.activeOnly) {
    where.status = "ACTIVE";
  } else if (filters.status && filters.status !== "ALL") {
    where.status = filters.status;
  }

  const network = filters.network?.trim();
  if (network) where.network = { contains: network };

  const category = filters.category?.trim();
  if (category) where.category = { contains: category };

  const country = filters.country?.trim();
  if (country) where.country = { contains: country };

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { network: { contains: q } },
      { category: { contains: q } },
      { country: { contains: q } },
    ];
  }

  return where;
}

async function listCpaOffers(
  filters: CpaOfferListFilters,
  options?: { activeOnly?: boolean },
): Promise<CpaOfferListResult> {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const where = buildWhere(filters, options);

  const [total, rows] = await Promise.all([
    prisma.cpaOffer.count({ where }),
    prisma.cpaOffer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    items: rows.map(serializeCpaOffer),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function listCpaOffersForAdmin(filters: CpaOfferListFilters) {
  return listCpaOffers(filters);
}

export function listActiveCpaOffers(filters: CpaOfferListFilters) {
  return listCpaOffers(filters, { activeOnly: true });
}

export async function getCpaOfferById(id: string): Promise<SerializedCpaOffer> {
  const row = await prisma.cpaOffer.findUnique({ where: { id } });
  if (!row) throw Errors.notFound("CPA offer");
  return serializeCpaOffer(row);
}

export async function getActiveCpaOfferById(id: string): Promise<SerializedCpaOffer> {
  const row = await prisma.cpaOffer.findFirst({
    where: { id, status: "ACTIVE" },
  });
  if (!row) throw Errors.notFound("CPA offer");
  return serializeCpaOffer(row);
}

export type CpaOfferInput = {
  name: string;
  network: string;
  category: string;
  country: string;
  previewUrl: string;
  trackingUrl: string;
  payout: number;
  status?: CpaOfferStatus;
};

export async function createCpaOffer(input: CpaOfferInput): Promise<SerializedCpaOffer> {
  const row = await prisma.cpaOffer.create({
    data: {
      name: input.name.trim(),
      network: input.network.trim(),
      category: input.category.trim(),
      country: input.country.trim(),
      previewUrl: input.previewUrl.trim(),
      trackingUrl: input.trackingUrl.trim(),
      payout: input.payout,
      status: input.status ?? "PAUSED",
      postbackToken: randomBytes(16).toString("hex"),
    },
  });
  return serializeCpaOffer(row);
}

export async function updateCpaOffer(
  id: string,
  input: Partial<CpaOfferInput>,
): Promise<SerializedCpaOffer> {
  const existing = await prisma.cpaOffer.findUnique({ where: { id } });
  if (!existing) throw Errors.notFound("CPA offer");

  const row = await prisma.cpaOffer.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.network !== undefined ? { network: input.network.trim() } : {}),
      ...(input.category !== undefined ? { category: input.category.trim() } : {}),
      ...(input.country !== undefined ? { country: input.country.trim() } : {}),
      ...(input.previewUrl !== undefined ? { previewUrl: input.previewUrl.trim() } : {}),
      ...(input.trackingUrl !== undefined ? { trackingUrl: input.trackingUrl.trim() } : {}),
      ...(input.payout !== undefined ? { payout: input.payout } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
  });
  return serializeCpaOffer(row);
}

export async function deleteCpaOffer(id: string): Promise<{ id: string }> {
  const existing = await prisma.cpaOffer.findUnique({ where: { id } });
  if (!existing) throw Errors.notFound("CPA offer");
  await prisma.cpaOffer.delete({ where: { id } });
  return { id };
}
