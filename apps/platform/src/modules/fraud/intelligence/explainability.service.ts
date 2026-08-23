import type {
  AdvertiserTrustView,
  ClusterSignal,
  ContextualRiskLevel,
  DeviceContext,
  IntelligenceExplanation,
  IpContext,
  TrustLevel,
  VelocitySignal,
} from "./types";

function levelToTrust(level: ContextualRiskLevel): TrustLevel {
  if (level === "low") return "high";
  if (level === "medium") return "medium";
  return "low";
}

export function buildExplanation(input: {
  score: number;
  level: ContextualRiskLevel;
  ipContext: IpContext | null;
  deviceContext: DeviceContext | null;
  velocity: VelocitySignal[];
  clusters: ClusterSignal[];
  flags: string[];
}): IntelligenceExplanation {
  const items: IntelligenceExplanation["items"] = [];

  if (input.deviceContext?.flags.includes("RAPID_IDENTITY_ROTATION")) {
    items.push({
      signal: "RAPID_IDENTITY_ROTATION",
      severity: "critical",
      window: "5m",
      text: `Multiple identities were submitted from the same device unusually quickly (${input.deviceContext.uniqueEmails} unique emails observed recently).`,
      advertiserSafe: true,
    });
  } else if (input.deviceContext?.flags.includes("MULTIPLE_EMAILS_SAME_DEVICE")) {
    items.push({
      signal: "MULTIPLE_EMAILS_SAME_DEVICE",
      severity: input.deviceContext.uniqueEmails >= 8 ? "high" : "medium",
      window: "24h",
      text: `Multiple identities were detected from the same device. ${input.deviceContext.uniqueEmails} different email addresses were submitted from this device within the last 24 hours.`,
      advertiserSafe: true,
    });
  }

  if (input.ipContext?.sharedIpLikely) {
    items.push({
      signal: "SHARED_IP_PATTERN",
      severity: "low",
      window: "24h",
      text: `This IP address has submitted ${input.ipContext.leadsLast24Hours} leads, but the submissions came from ${input.ipContext.uniqueDevices24Hours} different devices. This pattern may indicate shared or mobile network usage rather than direct fraud.`,
      advertiserSafe: true,
    });
  } else if (input.ipContext && input.ipContext.uniqueEmails24Hours >= 3 && input.ipContext.uniqueDevices24Hours <= 2) {
    items.push({
      signal: "IP_MANY_EMAILS",
      severity: "medium",
      window: "24h",
      text: `This IP submitted ${input.ipContext.leadsLast24Hours} leads with ${input.ipContext.uniqueEmails24Hours} unique emails in 24 hours.`,
      advertiserSafe: true,
    });
  }

  if (input.ipContext?.suspiciousVelocity) {
    items.push({
      signal: "IP_VELOCITY",
      severity: "medium",
      window: "1h",
      text: `High submission velocity from this IP: ${input.ipContext.leadsLast1Hour} leads in the last hour (${input.ipContext.leadsLast5Min} in the last 5 minutes).`,
      advertiserSafe: true,
    });
  }

  for (const v of input.velocity) {
    if (v.entity === "device" || v.entity === "ip") {
      items.push({
        signal: `${v.entity.toUpperCase()}_VELOCITY_${v.window}`,
        severity: v.severity,
        window: v.window,
        text: `${v.entity.toUpperCase()} velocity: ${v.count} leads within ${v.window}.`,
        advertiserSafe: v.entity === "device" || v.entity === "ip",
      });
    }
  }

  for (const c of input.clusters) {
    if (c.type === "PUBLISHER_HIGH_RISK_CONCENTRATION") {
      items.push({
        signal: c.type,
        severity: c.severity,
        window: String(c.evidence.window ?? "24h"),
        text: `Publisher traffic shows elevated concentration of high-risk leads (${c.evidence.highRiskRatio}% of recent sample).`,
        advertiserSafe: false,
      });
    }
    if (c.type === "SOURCE_HIGH_REJECTION") {
      items.push({
        signal: c.type,
        severity: c.severity,
        window: String(c.evidence.window ?? "24h"),
        text: `This traffic source has an elevated rejection rate (${c.evidence.rejectionRatio}% in the recent sample).`,
        advertiserSafe: true,
      });
    }
  }

  if (items.length === 0) {
    items.push({
      signal: "NORMAL_PATTERN",
      severity: "low",
      text: "No suspicious identity, velocity, or cluster patterns were detected for this lead.",
      advertiserSafe: true,
    });
  }

  const advertiserItems = items.filter((i) => i.advertiserSafe);
  const summary =
    input.level === "low"
      ? "Contextual review found normal or shared-network patterns."
      : `Contextual risk level is ${input.level} (score ${input.score}/100).`;

  const advertiserSummary =
    advertiserItems.find((i) => i.signal !== "NORMAL_PATTERN")?.text ??
    "No concerning identity or behavior patterns were detected.";

  return { summary, advertiserSummary, items };
}

export function toAdvertiserTrustView(
  level: ContextualRiskLevel,
  explanation: IntelligenceExplanation,
  extras?: { vpnDetected?: boolean; emailOk?: boolean },
): AdvertiserTrustView {
  const trustLevel = levelToTrust(level);
  const trustItems: AdvertiserTrustView["trustItems"] = [];

  if (extras?.emailOk !== false) {
    trustItems.push({ label: "Email validation passed", ok: true });
  }

  const hasDeviceIssue = explanation.items.some(
    (i) =>
      i.advertiserSafe &&
      (i.signal.includes("DEVICE") || i.signal.includes("IDENTITY") || i.signal.includes("EMAILS_SAME")),
  );
  trustItems.push({
    label: hasDeviceIssue ? "Suspicious device pattern detected" : "No suspicious device pattern",
    ok: !hasDeviceIssue,
  });

  const hasVelocity = explanation.items.some(
    (i) => i.advertiserSafe && i.signal.includes("VELOCITY"),
  );
  trustItems.push({
    label: hasVelocity ? "High submission velocity" : "Normal submission behavior",
    ok: !hasVelocity,
  });

  const sharedIp = explanation.items.some((i) => i.signal === "SHARED_IP_PATTERN");
  if (sharedIp) {
    trustItems.push({ label: "Shared IP activity detected", ok: true });
  }

  if (extras?.vpnDetected) {
    trustItems.push({ label: "Proxy/VPN detected", ok: false });
  }

  return {
    trustLevel,
    trustSummary: explanation.advertiserSummary,
    trustItems,
  };
}
