import type { CampaignCategory, CampaignStatus } from "@prisma/client";
import { format } from "date-fns";
import { DEFAULT_VERTICAL } from "@/lib/campaign-form";
import { parseCampaignTargeting } from "@/lib/campaign-targeting";

export type CampaignEditInitial = {
  id: string;
  advertiserId: string;
  name: string;
  status: CampaignStatus;
  category: CampaignCategory;
  cpl: number;
  budget: number;
  dailyCap: number | null;
  publisherAccess: string;
  autoApprove: boolean;
  targeting: unknown;
  pixelToken: string | null;
  leadCount: number;
};

export function getCampaignEditFormDefaults(campaign: CampaignEditInitial) {
  const targeting = parseCampaignTargeting(campaign.targeting);

  return {
    advertiserId: campaign.advertiserId,
    name: campaign.name,
    campaignStatus: campaign.status,
    autoApprove: campaign.autoApprove,
    optinPageId: targeting.optinPageId ?? "",
    startMode: targeting.scheduling.startMode,
    startDate: targeting.scheduling.startDate ?? format(new Date(), "yyyy-MM-dd"),
    endMode: targeting.scheduling.endMode,
    endDate: targeting.scheduling.endDate ?? format(new Date(), "yyyy-MM-dd"),
    trafficMode: targeting.trafficMode,
    vertical: targeting.vertical ?? DEFAULT_VERTICAL,
    selectedCountries: targeting.countries,
    blacklistedCountries: targeting.blacklistedCountries,
    devices: targeting.devices,
    operatingSystems: targeting.operatingSystems,
    blacklistedDevices: targeting.blacklistedDevices,
    blacklistedOperatingSystems: targeting.blacklistedOperatingSystems,
    excludeBlockedPublishers: targeting.excludeBlockedPublishers,
    cpl: String(campaign.cpl),
    totalBudget: campaign.budget > 0 ? String(campaign.budget) : "",
    dailyBudget: campaign.dailyCap ? String(campaign.dailyCap) : "",
    pixelToken: campaign.pixelToken,
  };
}
