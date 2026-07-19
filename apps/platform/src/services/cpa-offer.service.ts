import { randomBytes } from "node:crypto";
import type { CpaOffer, CpaOfferStatus, Prisma } from "@prisma/client";
import { buildCpaOfferPostbackUrl } from "@cpl/shared";
import { prisma } from "@/lib/prisma";
import { Errors } from "@/lib/errors";

export type CpaRevenueModel = "RPA" | "RPS" | "RPC" | "RPI" | "RPL" | "RPM";
export type CpaPayoutModel = "CPC" | "CPA" | "CPS" | "CPI" | "CPL" | "CPM";
export type CpaPayoutType = "FLAT" | "PERCENT";

export type SerializedCpaOffer = {
  id: string;
  name: string;
  network: string;
  category: string;
  country: string;
  previewUrl: string;
  trackingUrl: string;
  thumbnailUrl: string | null;
  advertiserLabel: string;
  revenueModel: CpaRevenueModel;
  payoutModel: CpaPayoutModel;
  payoutType: CpaPayoutType;
  revenue: string;
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
  id?: string;
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

function asRevenueModel(value: string): CpaRevenueModel {
  const allowed: CpaRevenueModel[] = ["RPA", "RPS", "RPC", "RPI", "RPL", "RPM"];
  return (allowed.includes(value as CpaRevenueModel) ? value : "RPA") as CpaRevenueModel;
}

function asPayoutModel(value: string): CpaPayoutModel {
  const allowed: CpaPayoutModel[] = ["CPC", "CPA", "CPS", "CPI", "CPL", "CPM"];
  return (allowed.includes(value as CpaPayoutModel) ? value : "CPA") as CpaPayoutModel;
}

function asPayoutType(value: string): CpaPayoutType {
  return value === "PERCENT" ? "PERCENT" : "FLAT";
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
    thumbnailUrl: row.thumbnailUrl ?? null,
    advertiserLabel: row.advertiserLabel || "Platform",
    revenueModel: asRevenueModel(row.revenueModel),
    payoutModel: asPayoutModel(row.payoutModel),
    payoutType: asPayoutType(row.payoutType),
    revenue: decimalToString(row.revenue),
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

  const id = filters.id?.trim();
  if (id) where.id = { contains: id };

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
      { advertiserLabel: { contains: q } },
      { id: { contains: q } },
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
  network?: string;
  category: string;
  country?: string;
  previewUrl?: string;
  trackingUrl: string;
  thumbnailUrl?: string | null;
  advertiserLabel?: string;
  revenueModel?: CpaRevenueModel;
  payoutModel?: CpaPayoutModel;
  payoutType?: CpaPayoutType;
  revenue: number;
  payout: number;
  status?: CpaOfferStatus;
};

export async function createCpaOffer(input: CpaOfferInput): Promise<SerializedCpaOffer> {
  const previewUrl = input.previewUrl?.trim() || "#";
  const network = input.network?.trim() || "Direct";
  const row = await prisma.cpaOffer.create({
    data: {
      name: input.name.trim(),
      network,
      category: input.category.trim(),
      country: input.country?.trim() || "",
      previewUrl,
      trackingUrl: input.trackingUrl.trim(),
      thumbnailUrl: input.thumbnailUrl?.trim() || null,
      advertiserLabel: (input.advertiserLabel?.trim() || "Platform").slice(0, 120),
      revenueModel: input.revenueModel ?? "RPA",
      payoutModel: input.payoutModel ?? "CPA",
      payoutType: input.payoutType ?? "FLAT",
      revenue: input.revenue,
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
      ...(input.thumbnailUrl !== undefined
        ? { thumbnailUrl: input.thumbnailUrl?.trim() || null }
        : {}),
      ...(input.advertiserLabel !== undefined
        ? { advertiserLabel: (input.advertiserLabel.trim() || "Platform").slice(0, 120) }
        : {}),
      ...(input.revenueModel !== undefined ? { revenueModel: input.revenueModel } : {}),
      ...(input.payoutModel !== undefined ? { payoutModel: input.payoutModel } : {}),
      ...(input.payoutType !== undefined ? { payoutType: input.payoutType } : {}),
      ...(input.revenue !== undefined ? { revenue: input.revenue } : {}),
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

export type CpaDashboardRange = "today" | "yesterday" | "last7d" | "thisMonth" | "lastMonth";

export type CpaDashboardSnapshot = {
  range: CpaDashboardRange;
  rangeLabel: string;
  from: string;
  to: string;
  metrics: {
    conversions: number;
    conversionsChangePct: number;
    hits: number;
    clicks: number;
    hitsClicksChangePct: number;
    cr: number;
    epc: number;
    payout: string;
    payoutChangePct: number;
  };
  series: Array<{
    date: string;
    label: string;
    clicks: number;
    uniqueClicks: number;
    conversions: number;
  }>;
  newOffers: Array<{
    id: string;
    name: string;
    status: CpaOfferStatus;
    thumbnailUrl: string | null;
    payoutModel: string;
    category: string;
    payout: string;
  }>;
};

function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function endOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

function addUtcDays(d: Date, days: number) {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

function resolveDashboardRange(range: CpaDashboardRange): {
  from: Date;
  to: Date;
  prevFrom: Date;
  prevTo: Date;
  label: string;
} {
  const now = new Date();
  const today = startOfUtcDay(now);

  if (range === "today") {
    const from = today;
    const to = endOfUtcDay(now);
    const prevFrom = addUtcDays(today, -1);
    const prevTo = endOfUtcDay(addUtcDays(today, -1));
    return { from, to, prevFrom, prevTo, label: "Today" };
  }

  if (range === "yesterday") {
    const from = addUtcDays(today, -1);
    const to = endOfUtcDay(addUtcDays(today, -1));
    const prevFrom = addUtcDays(today, -2);
    const prevTo = endOfUtcDay(addUtcDays(today, -2));
    return { from, to, prevFrom, prevTo, label: "Yesterday" };
  }

  if (range === "thisMonth") {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const to = endOfUtcDay(now);
    const prevFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const prevTo = endOfUtcDay(addUtcDays(from, -1));
    return { from, to, prevFrom, prevTo, label: "This Month" };
  }

  if (range === "lastMonth") {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const to = endOfUtcDay(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)));
    const prevFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1));
    const prevTo = endOfUtcDay(addUtcDays(from, -1));
    return { from, to, prevFrom, prevTo, label: "Last Month" };
  }

  // last7d (default)
  const from = addUtcDays(today, -6);
  const to = endOfUtcDay(now);
  const prevTo = endOfUtcDay(addUtcDays(from, -1));
  const prevFrom = addUtcDays(startOfUtcDay(prevTo), -6);
  return { from, to, prevFrom, prevTo, label: "Last 7 Days" };
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 10000) / 100;
}

async function conversionWindowStats(from: Date, to: Date) {
  const where = { createdAt: { gte: from, lte: to } };
  const [count, aggregate] = await Promise.all([
    prisma.cpaOfferConversion.count({ where }),
    prisma.cpaOfferConversion.aggregate({
      where,
      _sum: { payout: true },
    }),
  ]);
  return {
    count,
    payout: Number(aggregate._sum.payout ?? 0),
  };
}

function eachUtcDay(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  let cursor = startOfUtcDay(from);
  const last = startOfUtcDay(to);
  while (cursor.getTime() <= last.getTime()) {
    days.push(cursor);
    cursor = addUtcDays(cursor, 1);
  }
  return days;
}

export async function getCpaDashboardSnapshot(
  range: CpaDashboardRange = "last7d",
): Promise<CpaDashboardSnapshot> {
  const resolved = resolveDashboardRange(range);
  const { from, to, prevFrom, prevTo, label } = resolved;

  const [current, previous, conversionRows, newOfferRows] = await Promise.all([
    conversionWindowStats(from, to),
    conversionWindowStats(prevFrom, prevTo),
    prisma.cpaOfferConversion.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { createdAt: true },
    }),
    prisma.cpaOffer.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        status: true,
        thumbnailUrl: true,
        payoutModel: true,
        category: true,
        payout: true,
      },
    }),
  ]);

  const byDay = new Map<string, number>();
  for (const row of conversionRows) {
    const key = startOfUtcDay(row.createdAt).toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }

  const series = eachUtcDay(from, to).map((day) => {
    const key = day.toISOString().slice(0, 10);
    return {
      date: key,
      label: new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(day),
      clicks: 0,
      uniqueClicks: 0,
      conversions: byDay.get(key) ?? 0,
    };
  });

  const hits = 0;
  const clicks = 0;
  const cr = clicks > 0 ? Math.round((current.count / clicks) * 10000) / 100 : 0;
  const epc = clicks > 0 ? Math.round((current.payout / clicks) * 100) / 100 : 0;

  return {
    range,
    rangeLabel: label,
    from: from.toISOString(),
    to: to.toISOString(),
    metrics: {
      conversions: current.count,
      conversionsChangePct: pctChange(current.count, previous.count),
      hits,
      clicks,
      hitsClicksChangePct: 0,
      cr,
      epc,
      payout: decimalToString(current.payout),
      payoutChangePct: pctChange(current.payout, previous.payout),
    },
    series,
    newOffers: newOfferRows.map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status,
      thumbnailUrl: row.thumbnailUrl,
      payoutModel: row.payoutModel,
      category: row.category,
      payout: decimalToString(row.payout),
    })),
  };
}

export type SerializedCpaConversion = {
  id: string;
  offerId: string;
  offerName: string;
  offerStatus: CpaOfferStatus;
  clickId: string | null;
  payout: string | null;
  rawQuery: unknown;
  createdAt: string;
};

export type CpaConversionListResult = {
  items: SerializedCpaConversion[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CpaConversionListFilters = {
  q?: string;
  offerId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export async function listCpaConversionsForAdmin(
  filters: CpaConversionListFilters,
): Promise<CpaConversionListResult> {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));

  const where: Prisma.CpaOfferConversionWhereInput = {};

  const offerId = filters.offerId?.trim();
  if (offerId) where.offerId = offerId;

  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) {
      const from = new Date(filters.from);
      if (!Number.isNaN(from.getTime())) where.createdAt.gte = from;
    }
    if (filters.to) {
      const to = new Date(filters.to);
      if (!Number.isNaN(to.getTime())) where.createdAt.lte = to;
    }
  }

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { clickId: { contains: q } },
      { offer: { name: { contains: q } } },
      { offerId: { contains: q } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.cpaOfferConversion.count({ where }),
    prisma.cpaOfferConversion.findMany({
      where,
      include: { offer: { select: { name: true, status: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    items: rows.map((row) => ({
      id: row.id,
      offerId: row.offerId,
      offerName: row.offer.name,
      offerStatus: row.offer.status,
      clickId: row.clickId,
      payout: row.payout != null ? decimalToString(row.payout) : null,
      rawQuery: row.rawQuery,
      createdAt: row.createdAt.toISOString(),
    })),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
