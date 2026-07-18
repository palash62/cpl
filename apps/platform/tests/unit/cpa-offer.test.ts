import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { buildCpaOfferPostbackUrl } from "@cpl/shared";
import {
  serializeCpaOffer,
  listActiveCpaOffers,
  listCpaOffersForAdmin,
} from "@/services/cpa-offer.service";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    cpaOffer: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

describe("buildCpaOfferPostbackUrl", () => {
  it("builds unique postback URL with macros", () => {
    const url = buildCpaOfferPostbackUrl("abc123token", "https://leadgenlink.site");
    expect(url).toBe(
      "https://leadgenlink.site/pbtr/abc123token?click_id={click_id}&payout={payout}",
    );
  });
});

describe("serializeCpaOffer", () => {
  it("includes computed postbackUrl from token", () => {
    const prev = process.env.TRACKING_URL;
    process.env.TRACKING_URL = "https://leadgenlink.site";
    try {
      const serialized = serializeCpaOffer({
        id: "offer1",
        name: "Test Offer",
        network: "Net",
        category: "Finance",
        country: "US",
        previewUrl: "https://example.com/p",
        trackingUrl: "https://example.com/t",
        payout: { toString: () => "12.50" } as never,
        status: "ACTIVE",
        postbackToken: "tok_xyz",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      });

      expect(serialized.payout).toBe("12.50");
      expect(serialized.postbackUrl).toContain("/pbtr/tok_xyz?");
      expect(serialized.postbackUrl).toContain("click_id={click_id}");
      expect(serialized.postbackUrl).toContain("payout={payout}");
    } finally {
      process.env.TRACKING_URL = prev;
    }
  });
});

describe("cpa offer list visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("advertiser list forces ACTIVE status filter", async () => {
    vi.mocked(prisma.cpaOffer.count).mockResolvedValue(0);
    vi.mocked(prisma.cpaOffer.findMany).mockResolvedValue([]);

    await listActiveCpaOffers({ page: 1, limit: 20, status: "PAUSED" });

    expect(prisma.cpaOffer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "ACTIVE" }),
      }),
    );
  });

  it("admin list respects explicit status filter", async () => {
    vi.mocked(prisma.cpaOffer.count).mockResolvedValue(0);
    vi.mocked(prisma.cpaOffer.findMany).mockResolvedValue([]);

    await listCpaOffersForAdmin({ page: 1, limit: 20, status: "PAUSED" });

    expect(prisma.cpaOffer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "PAUSED" }),
      }),
    );
  });
});
