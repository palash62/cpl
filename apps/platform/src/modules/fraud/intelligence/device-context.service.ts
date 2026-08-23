import type { FraudIntelligenceConfig } from "../types/config";
import type { DeviceContext } from "./types";
import {
  countInWindow,
  extractEmail,
  extractPhone,
  filterWindow,
  MS,
  uniqueCount,
  type ContextLeadRow,
} from "./repositories/context.repo";

export function buildDeviceContext(
  rows: ContextLeadRow[],
  config: FraudIntelligenceConfig,
  now = new Date(),
): DeviceContext {
  const last24h = filterWindow(rows, MS.ONE_DAY, now);
  const lastHour = filterWindow(rows, MS.ONE_HOUR, now);
  const rapidWindow = filterWindow(
    rows,
    config.identity.rapidRotationWindowMinutes * MS.ONE_MIN,
    now,
  );

  const uniqueEmails = uniqueCount(last24h.map((r) => extractEmail(r.data)));
  const uniquePhones = uniqueCount(last24h.map((r) => extractPhone(r.data)));
  const uniqueIPs = uniqueCount(last24h.map((r) => r.ip));
  const uniquePublishers = uniqueCount(last24h.map((r) => r.publisherId));
  const uniqueSources = uniqueCount(last24h.map((r) => r.source));

  const flags: string[] = [];
  if (uniqueEmails >= config.identity.multiEmailDeviceThreshold) {
    flags.push("MULTIPLE_EMAILS_SAME_DEVICE");
  }
  if (uniquePhones >= config.identity.multiPhoneDeviceThreshold) {
    flags.push("MULTIPLE_PHONES_SAME_DEVICE");
  }
  const rapidEmails = uniqueCount(rapidWindow.map((r) => extractEmail(r.data)));
  if (rapidEmails >= config.identity.rapidRotationEmails) {
    flags.push("RAPID_IDENTITY_ROTATION");
  }

  return {
    leadsLastHour: lastHour.length,
    leadsLast24Hours: last24h.length,
    uniqueEmails,
    uniquePhones,
    uniqueIPs,
    uniquePublishers,
    uniqueSources,
    flags,
  };
}
