import { describe, it, expect, afterEach } from "vitest";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import {
  createOptinFunnel,
  deleteOptinFunnel,
  publishOptinFunnel,
  updateOptinFunnel,
} from "@/services/optin-funnel.service";
import { createCpaOffer, deleteCpaOffer } from "@/services/cpa-offer.service";

const createdFunnelIds: string[] = [];
const createdOfferIds: string[] = [];

async function getDemoAdvertiserId() {
  const user = await prisma.user.findUnique({
    where: { email: "advertiser@cpl.local" },
    select: { id: true },
  });
  if (!user) throw new Error("Seed advertiser not found");
  return user.id;
}

afterEach(async () => {
  const advertiserId = await getDemoAdvertiserId().catch(() => null);
  while (createdFunnelIds.length > 0) {
    const id = createdFunnelIds.pop();
    if (!id || !advertiserId) continue;
    try {
      await deleteOptinFunnel(id, advertiserId);
    } catch {
      // already removed
    }
  }
  while (createdOfferIds.length > 0) {
    const id = createdOfferIds.pop();
    if (!id) continue;
    try {
      await deleteCpaOffer(id);
    } catch {
      // already removed
    }
  }
});

describe("Advertiser optin funnel CPA offer settings", () => {
  it("accepts cpaOfferId without destination URL when thank-you is off", async () => {
    const advertiserId = await getDemoAdvertiserId();
    const funnel = await createOptinFunnel(advertiserId, {
      name: "Vitest CPA Funnel",
      editorType: "BUILDER",
    });
    createdFunnelIds.push(funnel.id);

    const offer = await createCpaOffer({
      name: "Vitest Offer",
      network: "Direct",
      category: "Finance",
      country: "US",
      previewUrl: "https://example.com/preview",
      trackingUrl: "https://example.com/offer",
      revenueModel: "RPA",
      payoutModel: "CPA",
      payoutType: "FLAT",
      revenue: 10,
      payout: 5,
      status: "ACTIVE",
    });
    createdOfferIds.push(offer.id);

    const updated = await updateOptinFunnel(funnel.id, advertiserId, {
      thankYouEnabled: false,
      cpaOfferId: offer.id,
    });

    expect(updated.thankYouEnabled).toBe(false);
    expect(updated.cpaOfferId).toBe(offer.id);
    expect(updated.destinationUrl).toBeNull();
  });

  it("rejects invalid cpaOfferId when thank-you is off", async () => {
    const advertiserId = await getDemoAdvertiserId();
    const funnel = await createOptinFunnel(advertiserId, {
      name: "Vitest CPA Validation",
      editorType: "BUILDER",
    });
    createdFunnelIds.push(funnel.id);

    await expect(
      updateOptinFunnel(funnel.id, advertiserId, {
        thankYouEnabled: false,
        cpaOfferId: "nonexistent-offer-id",
      }),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      message: "Selected CPA offer is invalid or not active.",
    } satisfies Partial<AppError>);
  });

  it("requires destination URL or CPA offer before publish when thank-you is off", async () => {
    const advertiserId = await getDemoAdvertiserId();
    const funnel = await createOptinFunnel(advertiserId, {
      name: "Vitest Publish Gate",
      editorType: "BUILDER",
    });
    createdFunnelIds.push(funnel.id);

    await expect(publishOptinFunnel(funnel.id, advertiserId)).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    } satisfies Partial<AppError>);
  });
});
