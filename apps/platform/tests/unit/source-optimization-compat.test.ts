import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildSourceToken } from "@cpl/shared";

const prismaMock = vi.hoisted(() => ({
  advertiserSourceBlock: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  campaignSourceBid: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import {
  getBlockedSourceTokensByAdvertiser,
  getSourceBidsByCampaignIds,
  isSourceBlocked,
  resolveSourceCpl,
} from "@/services/source-optimization.service";

describe("source optimization backward compatibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("isSourceBlocked returns false when no block row exists (legacy traffic unchanged)", async () => {
    prismaMock.advertiserSourceBlock.findUnique.mockResolvedValue(null);

    const blocked = await isSourceBlocked("adv1", "pub1", "facebook");

    expect(blocked).toBe(false);
    expect(prismaMock.advertiserSourceBlock.findUnique).toHaveBeenCalledWith({
      where: {
        advertiserId_sourceToken: {
          advertiserId: "adv1",
          sourceToken: buildSourceToken("adv1", "pub1", "facebook"),
        },
      },
      select: { id: true },
    });
  });

  it("resolveSourceCpl falls back to campaign CPL when no bid override exists", async () => {
    prismaMock.campaignSourceBid.findUnique.mockResolvedValue(null);

    const cpl = await resolveSourceCpl({
      advertiserId: "adv1",
      campaignId: "camp1",
      publisherId: "pub1",
      source: "tiktok",
      campaignCpl: 12.5,
    });

    expect(cpl).toBe(12.5);
  });

  it("resolveSourceCpl uses override only when advertiser set a source bid", async () => {
    const token = buildSourceToken("adv1", "pub1", "tiktok");
    prismaMock.campaignSourceBid.findUnique.mockResolvedValue({ cpl: 15 });

    const cpl = await resolveSourceCpl({
      advertiserId: "adv1",
      campaignId: "camp1",
      publisherId: "pub1",
      source: "tiktok",
      campaignCpl: 12.5,
    });

    expect(cpl).toBe(15);
    expect(prismaMock.campaignSourceBid.findUnique).toHaveBeenCalledWith({
      where: { campaignId_sourceToken: { campaignId: "camp1", sourceToken: token } },
      select: { cpl: true },
    });
  });

  it("getBlockedSourceTokensByAdvertiser returns empty map when no blocks (smart link unchanged)", async () => {
    prismaMock.advertiserSourceBlock.findMany.mockResolvedValue([]);

    const map = await getBlockedSourceTokensByAdvertiser(["adv1", "adv2"]);

    expect(map.size).toBe(0);
  });

  it("getSourceBidsByCampaignIds returns empty map when no bids (wallet check uses campaign CPL)", async () => {
    prismaMock.campaignSourceBid.findMany.mockResolvedValue([]);

    const map = await getSourceBidsByCampaignIds(["camp1", "camp2"]);

    expect(map.size).toBe(0);
  });

  it("empty advertiser/campaign id lists skip DB queries", async () => {
    const blocks = await getBlockedSourceTokensByAdvertiser([]);
    const bids = await getSourceBidsByCampaignIds([]);

    expect(blocks.size).toBe(0);
    expect(bids.size).toBe(0);
    expect(prismaMock.advertiserSourceBlock.findMany).not.toHaveBeenCalled();
    expect(prismaMock.campaignSourceBid.findMany).not.toHaveBeenCalled();
  });

  it("null/empty source tags normalize to unknown without throwing", async () => {
    prismaMock.advertiserSourceBlock.findUnique.mockResolvedValue(null);
    prismaMock.campaignSourceBid.findUnique.mockResolvedValue(null);

    await expect(isSourceBlocked("adv1", "pub1", null)).resolves.toBe(false);
    await expect(isSourceBlocked("adv1", "pub1", undefined)).resolves.toBe(false);
    await expect(
      resolveSourceCpl({
        advertiserId: "adv1",
        campaignId: "camp1",
        publisherId: "pub1",
        source: null,
        campaignCpl: 10,
      }),
    ).resolves.toBe(10);
  });
});
