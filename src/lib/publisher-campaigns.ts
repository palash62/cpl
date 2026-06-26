export { defaultCampaignDateFrom, defaultCampaignDateTo } from "@/lib/advertiser-campaigns";

export function shortPublisherCampaignId(id: string) {
  return id.slice(-8).toUpperCase();
}
