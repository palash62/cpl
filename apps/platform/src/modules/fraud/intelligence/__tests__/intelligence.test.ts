import { describe, expect, it } from "vitest";
import { DEFAULT_INTELLIGENCE_CONFIG } from "@/modules/fraud/intelligence/config";
import { buildIpContext } from "@/modules/fraud/intelligence/ip-context.service";
import { buildDeviceContext } from "@/modules/fraud/intelligence/device-context.service";
import { buildVelocitySignals } from "@/modules/fraud/intelligence/velocity.service";
import { buildClusterSignals } from "@/modules/fraud/intelligence/identity-cluster.service";
import { computeContextualRiskScore } from "@/modules/fraud/intelligence/contextual-score.service";
import { toAdvertiserTrustView, buildExplanation } from "@/modules/fraud/intelligence/explainability.service";
import type { ContextLeadRow } from "@/modules/fraud/intelligence/repositories/context.repo";
import { DEFAULT_FRAUD_CONFIG } from "@/modules/fraud/config/defaults";
import { decideFraud } from "@/modules/fraud/scoring/decide";

const now = new Date("2026-08-23T12:00:00.000Z");

function row(partial: Partial<ContextLeadRow> & { createdAt: Date; data?: unknown }): ContextLeadRow {
  return {
    id: partial.id ?? Math.random().toString(36).slice(2),
    createdAt: partial.createdAt,
    ip: partial.ip ?? "1.2.3.4",
    deviceFingerprint: partial.deviceFingerprint ?? "fp-a",
    publisherId: partial.publisherId ?? "pub-1",
    campaignId: partial.campaignId ?? "camp-1",
    source: partial.source ?? "src-1",
    status: partial.status ?? "APPROVED",
    riskScore: partial.riskScore ?? 10,
    data: partial.data ?? { email: "a@example.com", phone: "111" },
  };
}

describe("fraud intelligence contextual scoring", () => {
  it("same IP + different devices + long gaps → low contextual risk", () => {
    const rows = [
      row({
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        deviceFingerprint: "fp-1",
        data: { email: "a@example.com" },
      }),
      row({
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        deviceFingerprint: "fp-2",
        data: { email: "b@example.com" },
      }),
      row({
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        deviceFingerprint: "fp-3",
        data: { email: "c@example.com" },
      }),
      row({
        createdAt: now,
        deviceFingerprint: "fp-4",
        data: { email: "d@example.com" },
      }),
    ];

    const ipContext = buildIpContext(rows, DEFAULT_INTELLIGENCE_CONFIG, now);
    const deviceContext = buildDeviceContext(
      rows.filter((r) => r.deviceFingerprint === "fp-4"),
      DEFAULT_INTELLIGENCE_CONFIG,
      now,
    );
    const velocity = buildVelocitySignals({
      ipRows: rows,
      deviceRows: rows.filter((r) => r.deviceFingerprint === "fp-4"),
      publisherRows: [],
      sourceRows: [],
      campaignRows: [],
      config: DEFAULT_INTELLIGENCE_CONFIG,
      now,
    });
    const clusters = buildClusterSignals({
      ipContext,
      deviceContext,
      publisherRows: [],
      sourceRows: [],
      config: DEFAULT_INTELLIGENCE_CONFIG,
      now,
    });
    const { score, level } = computeContextualRiskScore({
      ipContext,
      deviceContext,
      velocity,
      clusters,
      config: DEFAULT_INTELLIGENCE_CONFIG,
    });

    expect(ipContext.sharedIpLikely).toBe(true);
    expect(level).toBe("low");
    expect(score).toBeLessThanOrEqual(24);
  });

  it("same IP + same device + multiple emails → high contextual risk", () => {
    const rows = Array.from({ length: 6 }, (_, i) =>
      row({
        createdAt: new Date(now.getTime() - (6 - i) * 60 * 60 * 1000),
        deviceFingerprint: "fp-same",
        data: { email: `user${i}@example.com`, phone: `555000${i}` },
      }),
    );

    const ipContext = buildIpContext(rows, DEFAULT_INTELLIGENCE_CONFIG, now);
    const deviceContext = buildDeviceContext(rows, DEFAULT_INTELLIGENCE_CONFIG, now);
    const velocity = buildVelocitySignals({
      ipRows: rows,
      deviceRows: rows,
      publisherRows: [],
      sourceRows: [],
      campaignRows: [],
      config: DEFAULT_INTELLIGENCE_CONFIG,
      now,
    });
    const clusters = buildClusterSignals({
      ipContext,
      deviceContext,
      publisherRows: [],
      sourceRows: [],
      config: DEFAULT_INTELLIGENCE_CONFIG,
      now,
    });
    const { score, level } = computeContextualRiskScore({
      ipContext,
      deviceContext,
      velocity,
      clusters,
      config: DEFAULT_INTELLIGENCE_CONFIG,
    });

    expect(deviceContext.flags).toContain("MULTIPLE_EMAILS_SAME_DEVICE");
    expect(clusters.some((c) => c.type === "SAME_DEVICE_MULTIPLE_IDENTITIES")).toBe(true);
    expect(["high", "critical", "medium"]).toContain(level);
    expect(score).toBeGreaterThanOrEqual(25);
  });

  it("same device + many identities in 5 minutes → critical", () => {
    const rows = Array.from({ length: 6 }, (_, i) =>
      row({
        createdAt: new Date(now.getTime() - i * 30_000),
        deviceFingerprint: "fp-fast",
        data: { email: `fast${i}@example.com` },
      }),
    );

    const deviceContext = buildDeviceContext(rows, DEFAULT_INTELLIGENCE_CONFIG, now);
    const ipContext = buildIpContext(rows, DEFAULT_INTELLIGENCE_CONFIG, now);
    const clusters = buildClusterSignals({
      ipContext,
      deviceContext,
      publisherRows: [],
      sourceRows: [],
      config: DEFAULT_INTELLIGENCE_CONFIG,
      now,
    });
    const { score, level } = computeContextualRiskScore({
      ipContext,
      deviceContext,
      velocity: [],
      clusters,
      config: DEFAULT_INTELLIGENCE_CONFIG,
    });

    expect(deviceContext.flags).toContain("RAPID_IDENTITY_ROTATION");
    expect(level).toBe("critical");
    expect(score).toBeGreaterThanOrEqual(75);
  });

  it("shared IP across publishers stays contextual, not automatic fraud", () => {
    const rows = [
      row({
        createdAt: now,
        publisherId: "p1",
        deviceFingerprint: "d1",
        data: { email: "a@x.com" },
      }),
      row({
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        publisherId: "p2",
        deviceFingerprint: "d2",
        data: { email: "b@x.com" },
      }),
      row({
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        publisherId: "p3",
        deviceFingerprint: "d3",
        data: { email: "c@x.com" },
      }),
    ];
    const ipContext = buildIpContext(rows, DEFAULT_INTELLIGENCE_CONFIG, now);
    expect(ipContext.uniquePublishers24Hours).toBe(3);
    expect(ipContext.sharedIpLikely).toBe(true);

    const { score } = computeContextualRiskScore({
      ipContext,
      deviceContext: null,
      velocity: [],
      clusters: buildClusterSignals({
        ipContext,
        deviceContext: null,
        publisherRows: [],
        sourceRows: [],
        config: DEFAULT_INTELLIGENCE_CONFIG,
        now,
      }),
      config: DEFAULT_INTELLIGENCE_CONFIG,
    });
    expect(score).toBeLessThanOrEqual(24);
  });

  it("normal repeated users avoid false positives", () => {
    const rows = [
      row({
        createdAt: now,
        deviceFingerprint: "fp-user",
        data: { email: "same@example.com", phone: "999" },
      }),
      row({
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        deviceFingerprint: "fp-user",
        data: { email: "same@example.com", phone: "999" },
      }),
    ];
    const deviceContext = buildDeviceContext(rows, DEFAULT_INTELLIGENCE_CONFIG, now);
    expect(deviceContext.flags).not.toContain("MULTIPLE_EMAILS_SAME_DEVICE");
    expect(deviceContext.flags).not.toContain("RAPID_IDENTITY_ROTATION");
  });

  it("observation mode defaults never change decideFraud outcomes", () => {
    expect(DEFAULT_FRAUD_CONFIG.intelligence.observationOnly).toBe(true);
    const decision = decideFraud(
      15,
      [{ rule: "role_email", passed: true, riskDelta: 0, hardFail: false }],
      DEFAULT_FRAUD_CONFIG,
    );
    expect(decision.fraudDecision).toBe("auto_approve");
    expect(decision.hardReject).toBe(false);
  });

  it("advertiser trust inverts contextual level and sanitizes copy", () => {
    const explanation = buildExplanation({
      score: 72,
      level: "high",
      ipContext: null,
      deviceContext: {
        leadsLastHour: 6,
        leadsLast24Hours: 8,
        uniqueEmails: 6,
        uniquePhones: 1,
        uniqueIPs: 1,
        uniquePublishers: 1,
        uniqueSources: 1,
        flags: ["MULTIPLE_EMAILS_SAME_DEVICE"],
      },
      velocity: [],
      clusters: [],
      flags: ["MULTIPLE_EMAILS_SAME_DEVICE"],
    });
    const trust = toAdvertiserTrustView("high", explanation);
    expect(trust.trustLevel).toBe("low");
    expect(trust.trustSummary.toLowerCase()).not.toContain("riskdelta");
    expect(trust.trustItems.some((i) => !i.ok)).toBe(true);
  });
});
