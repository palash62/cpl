export type CampaignTargeting = {
  destinationUrl?: string;
  optinPageId?: string;
  optinSlug?: string;
  excludeBlockedPublishers?: boolean;
  [key: string]: unknown;
};

export function campaignExcludesBlockedPublishers(targeting: unknown): boolean {
  if (!targeting || typeof targeting !== "object") return false;
  return Boolean((targeting as CampaignTargeting).excludeBlockedPublishers);
}
