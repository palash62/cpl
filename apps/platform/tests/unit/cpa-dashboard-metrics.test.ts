import { describe, expect, it, vi, beforeEach } from "vitest";

let lastClickCountWhere: unknown;
let lastConversionCountWhere: unknown;
let lastClickFindManyWhere: unknown;

const offerRevenue = 100;
const offerPayout = 20;

vi.mock("@/lib/prisma", () => {
  return {
    prisma: {
      cpaOffer: {
        findMany: vi.fn(),
      },
      cpaOfferClick: {
        count: vi.fn(),
        groupBy: vi.fn(),
        findMany: vi.fn(),
      },
      cpaOfferConversion: {
        count: vi.fn(),
        groupBy: vi.fn(),
        findMany: vi.fn(),
      },
      cpaPostbackDelivery: {
        groupBy: vi.fn(),
        findMany: vi.fn(),
      },
    },
  };
});

import { prisma } from "@/lib/prisma";

beforeEach(() => {
  vi.clearAllMocks();
  lastClickCountWhere = undefined;
  lastConversionCountWhere = undefined;
  lastClickFindManyWhere = undefined;

  // New offers + revenue totals both use cpaOffer.findMany; distinguish by query shape.
  (prisma.cpaOffer.findMany as any).mockImplementation(async (args: any) => {
    // Called for revenue totals (where: { id: { in: [...] } })
    if (args?.where?.id?.in) {
      const id = args.where.id.in[0];
      return [
        {
          id,
          revenue: offerRevenue,
          payout: offerPayout,
        },
      ];
    }

    // Called for dashboard "new offers" section.
    return [];
  });

  // Click stats: hits=10, unique IP groups=3 -> clicks=3
  (prisma.cpaOfferClick.count as any).mockImplementation(async (args: any) => {
    lastClickCountWhere = args?.where;
    return 10;
  });

  (prisma.cpaOfferClick.groupBy as any).mockResolvedValue([
    { ip: "1.1.1.1", _count: { _all: 1 } },
    { ip: "2.2.2.2", _count: { _all: 1 } },
    { ip: "3.3.3.3", _count: { _all: 1 } },
  ] as any);

  (prisma.cpaOfferClick.findMany as any).mockImplementation(async (args: any) => {
    lastClickFindManyWhere = args?.where;
    // Provide only one UTC day worth of click rows.
    return [
      { createdAt: new Date("2026-07-20T10:00:00.000Z"), ip: "1.1.1.1" },
      { createdAt: new Date("2026-07-20T11:00:00.000Z"), ip: "1.1.1.1" },
      { createdAt: new Date("2026-07-20T12:00:00.000Z"), ip: "2.2.2.2" },
    ] as any;
  });

  // Conversion stats: total=5 conversions
  (prisma.cpaOfferConversion.count as any).mockImplementation(async (args: any) => {
    lastConversionCountWhere = args?.where;
    return 5;
  });

  // A|P|R derived from *advertiser global* deliveries:
  // pending conversions: {c1,c2} (2 conversions)
  // rejected conversions: {c3} (1 conversion, not in pending)
  (prisma.cpaPostbackDelivery.groupBy as any).mockImplementation(async (args: any) => {
    const status = JSON.stringify(args?.where?.status ?? "");
    if (status.includes("PENDING")) {
      return [{ conversionId: "c1" }, { conversionId: "c2" }] as any;
    }
    return [{ conversionId: "c3" }] as any;
  });

  // Revenue/payout/profit from groupBy:
  // totalPerOffer: count=5
  // nonNull payout groupBy: count=3 and sum payout=150
  (prisma.cpaOfferConversion.groupBy as any).mockImplementation(async (args: any) => {
    if (args?.where?.payout && Object.prototype.hasOwnProperty.call(args.where.payout, "not")) {
      return [
        {
          offerId: "offer1",
          _count: { id: 3 },
          _sum: { payout: 150 },
        },
      ] as any;
    }
    return [{ offerId: "offer1", _count: { id: 5 } }] as any;
  });

  // Series: 5 conversions today
  (prisma.cpaOfferConversion.findMany as any).mockResolvedValue([
    { createdAt: new Date("2026-07-20T10:00:00.000Z") },
    { createdAt: new Date("2026-07-20T10:05:00.000Z") },
    { createdAt: new Date("2026-07-20T10:10:00.000Z") },
    { createdAt: new Date("2026-07-20T10:15:00.000Z") },
    { createdAt: new Date("2026-07-20T10:20:00.000Z") },
  ] as any);

  // listCpaConversionsForAdvertiser defaults (not used in dashboard snapshot tests)
  (prisma.cpaPostbackDelivery.findMany as any).mockResolvedValue([] as any);
});

describe("CPA dashboard metrics aggregation", () => {
  it("computes hits/clicks, A|P|R, and revenue/payout/profit with payout fallback", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-20T12:00:00.000Z"));

    const { getCpaDashboardSnapshot } = await import("@/services/cpa-offer.service");
    const snapshot = await getCpaDashboardSnapshot("today");

    // hits/clicks
    expect(snapshot.metrics.hits).toBe(10);
    expect(snapshot.metrics.clicks).toBe(3);

    // A|P|R: total=5, pending=2, rejected=1 => approved=2
    expect(snapshot.metrics.conversionsApproved).toBe(2);
    expect(snapshot.metrics.conversionsPending).toBe(2);
    expect(snapshot.metrics.conversionsRejected).toBe(1);

    // Revenue/payout/profit:
    // revenue = 5 * 100 = 500
    // payout = (sum non-null 150) + (null count 2 * offer payout 20) = 150 + 40 = 190
    // profit = 500 - 190 = 310
    expect(snapshot.metrics.revenue).toBe("500.00");
    expect(snapshot.metrics.payout).toBe("190.00");
    expect(snapshot.metrics.profit).toBe("310.00");

    // Series for "today" includes one day.
    expect(snapshot.series).toHaveLength(1);
    expect(snapshot.series[0].clicks).toBe(3);
    expect(snapshot.series[0].uniqueClicks).toBe(2);
    expect(snapshot.series[0].conversions).toBe(5);

    vi.useRealTimers();
  });

  it("scopes advertiser snapshot to advertiserId in click + conversion where clauses", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-20T12:00:00.000Z"));

    const { getAdvertiserCpaDashboardSnapshot } = await import("@/services/cpa-offer.service");
    await getAdvertiserCpaDashboardSnapshot("adv-1", "today");

    expect(lastClickCountWhere).toEqual(
      expect.objectContaining({ advertiserId: "adv-1" }),
    );
    expect(lastConversionCountWhere).toEqual(
      expect.objectContaining({ advertiserId: "adv-1" }),
    );
    expect(lastClickFindManyWhere).toEqual(
      expect.objectContaining({ advertiserId: "adv-1" }),
    );

    vi.useRealTimers();
  });
});

describe("CPA conversions list scoping + A|P|R mapping", () => {
  it("listCpaConversionsForAdvertiser always filters by advertiserId and maps delivery statuses to A|P|R", async () => {
    const { listCpaConversionsForAdvertiser } = await import("@/services/cpa-offer.service");
    (prisma.cpaOfferConversion.count as any).mockResolvedValue(2);
    (prisma.cpaOfferConversion.findMany as any).mockResolvedValue([
      {
        id: "c1",
        offerId: "offer1",
        clickId: "click-1",
        payout: null,
        rawQuery: { foo: "bar" },
        createdAt: new Date("2026-07-20T10:00:00.000Z"),
        advertiserId: "adv-1",
        offer: { name: "Offer 1", status: "ACTIVE", revenue: offerRevenue, payout: offerPayout },
      },
      {
        id: "c2",
        offerId: "offer1",
        clickId: "click-2",
        payout: null,
        rawQuery: { baz: "qux" },
        createdAt: new Date("2026-07-20T11:00:00.000Z"),
        advertiserId: "adv-1",
        offer: { name: "Offer 1", status: "ACTIVE", revenue: offerRevenue, payout: offerPayout },
      },
    ] as any);

    (prisma.cpaPostbackDelivery.findMany as any).mockResolvedValue([
      { conversionId: "c2", status: "PENDING" },
    ] as any);

    await listCpaConversionsForAdvertiser("adv-1", { page: 1, limit: 20 });

    expect(prisma.cpaOfferConversion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ advertiserId: "adv-1" }),
      }),
    );

    const res = await listCpaConversionsForAdvertiser("adv-1", { page: 1, limit: 20 });
    expect(res.items).toHaveLength(2);
    // c1 has no advertiser-global deliveries => A
    expect(res.items[0].status).toBe("A");
    // c2 has PENDING advertiser-global delivery => P
    expect(res.items[1].status).toBe("P");
    // payout fallback to offer.payout when conversion payout is null
    expect(res.items[0].payout).toBe(String(offerPayout));
  });
});

