import type { FraudIntelligenceConfig } from "../types/config";
import type { IpContext } from "./types";
import {
  countInWindow,
  extractEmail,
  extractPhone,
  filterWindow,
  MS,
  uniqueCount,
  type ContextLeadRow,
} from "./repositories/context.repo";

export function buildIpContext(
  rows: ContextLeadRow[],
  config: FraudIntelligenceConfig,
  now = new Date(),
): IpContext {
  const last24h = filterWindow(rows, MS.ONE_DAY, now);
  const uniqueEmails24 = uniqueCount(last24h.map((r) => extractEmail(r.data)));
  const uniqueDevices24 = uniqueCount(last24h.map((r) => r.deviceFingerprint));
  const uniquePublishers24 = uniqueCount(last24h.map((r) => r.publisherId));
  const uniqueSources24 = uniqueCount(last24h.map((r) => r.source));
  const uniqueCampaigns24 = uniqueCount(last24h.map((r) => r.campaignId));
  const uniquePhones24 = uniqueCount(last24h.map((r) => extractPhone(r.data)));

  const leadsLast5Min = countInWindow(rows, MS.FIVE_MIN, now);
  const leadsLast1Hour = countInWindow(rows, MS.ONE_HOUR, now);
  const leadsLast24Hours = last24h.length;
  const leadsLast7Days = rows.length;

  const sharedIpLikely =
    uniqueDevices24 >= config.identity.sharedIpDeviceMin &&
    (uniqueEmails24 === 0 ||
      uniqueDevices24 / Math.max(uniqueEmails24, 1) >= 1 - config.identity.sharedIpEmailMaxRatio);

  const suspiciousVelocity =
    leadsLast5Min >= config.velocity.ip.per5Min || leadsLast1Hour >= config.velocity.ip.per1Hour;

  return {
    leadsLast5Min,
    leadsLast1Hour,
    leadsLast24Hours,
    leadsLast7Days,
    uniqueEmails24Hours: uniqueEmails24,
    uniquePhones24Hours: uniquePhones24,
    uniqueDevices24Hours: uniqueDevices24,
    uniquePublishers24Hours: uniquePublishers24,
    uniqueSources24Hours: uniqueSources24,
    uniqueCampaigns24Hours: uniqueCampaigns24,
    sharedIpLikely,
    suspiciousVelocity,
  };
}
