import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  formatLeadRevenue,
  formatLeadSaleLabel,
  loadCpaMetricsByLeadIds,
} from "@/lib/cpa-lead-metrics";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    cpaOfferClick: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

describe("formatLeadSaleLabel", () => {
  it("returns em dash for zero sales", () => {
    expect(formatLeadSaleLabel(0)).toBe("—");
  });

  it("returns singular label for one sale", () => {
    expect(formatLeadSaleLabel(1)).toBe("1 sale");
  });

  it("returns plural label for multiple sales", () => {
    expect(formatLeadSaleLabel(2)).toBe("2 sales");
  });
});

describe("formatLeadRevenue", () => {
  it("returns em dash for zero revenue", () => {
    expect(formatLeadRevenue(0)).toBe("—");
  });

  it("formats positive revenue as USD", () => {
    expect(formatLeadRevenue(12.5)).toBe("$12.50");
  });
});

describe("loadCpaMetricsByLeadIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty map for no lead ids", async () => {
    const result = await loadCpaMetricsByLeadIds([]);
    expect(result.size).toBe(0);
    expect(prisma.cpaOfferClick.findMany).not.toHaveBeenCalled();
  });

  it("aggregates conversion count and earning revenue per lead", async () => {
    vi.mocked(prisma.cpaOfferClick.findMany).mockResolvedValue([
      {
        leadId: "lead-1",
        conversions: [
          { cpaEarning: { amount: { toString: () => "10.00" } } },
          { cpaEarning: { amount: { toString: () => "5.50" } } },
        ],
      },
      {
        leadId: "lead-2",
        conversions: [{ cpaEarning: null }],
      },
    ] as never);

    const result = await loadCpaMetricsByLeadIds(["lead-1", "lead-2"]);

    expect(result.get("lead-1")).toEqual({ salesCount: 2, revenue: 15.5 });
    expect(result.get("lead-2")).toEqual({ salesCount: 1, revenue: 0 });
  });
});
