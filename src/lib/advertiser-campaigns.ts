import { format, subDays } from "date-fns";

export function defaultCampaignDateFrom() {
  return format(subDays(new Date(), 30), "yyyy-MM-dd");
}

export function defaultCampaignDateTo() {
  return format(new Date(), "yyyy-MM-dd");
}
