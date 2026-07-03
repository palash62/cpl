import { format } from "date-fns";
import {
  formatSelectedCountriesSummary,
  getCountryName,
  type CountryTier,
} from "@/lib/campaign-form";

export type CampaignTargeting = {
  destinationUrl?: string;
  optinPageId?: string;
  optinSlug?: string;
  vertical?: string;
  trafficMode?: "allow" | "block";
  scheduling?: {
    startMode?: "now" | "scheduled";
    startDate?: string | null;
    endMode?: "forever" | "scheduled";
    endDate?: string | null;
  };
  countries?: string[];
  blacklistedCountries?: string[];
  devices?: string[];
  operatingSystems?: string[];
  blacklistedDevices?: string[];
  blacklistedOperatingSystems?: string[];
  excludeBlockedPublishers?: boolean;
  [key: string]: unknown;
};

export type ParsedCampaignTargeting = {
  destinationUrl: string | null;
  optinPageId: string | null;
  optinSlug: string | null;
  vertical: string | null;
  trafficMode: "allow" | "block";
  scheduling: {
    startMode: "now" | "scheduled";
    startDate: string | null;
    endMode: "forever" | "scheduled";
    endDate: string | null;
  };
  countries: string[];
  blacklistedCountries: string[];
  devices: string[];
  operatingSystems: string[];
  blacklistedDevices: string[];
  blacklistedOperatingSystems: string[];
  excludeBlockedPublishers: boolean;
};

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function parseCampaignTargeting(targeting: unknown): ParsedCampaignTargeting {
  const raw = (
    targeting && typeof targeting === "object" ? targeting : {}
  ) as CampaignTargeting;
  const scheduling =
    raw.scheduling && typeof raw.scheduling === "object" ? raw.scheduling : {};

  return {
    destinationUrl: typeof raw.destinationUrl === "string" ? raw.destinationUrl : null,
    optinPageId: typeof raw.optinPageId === "string" ? raw.optinPageId : null,
    optinSlug: typeof raw.optinSlug === "string" ? raw.optinSlug : null,
    vertical: typeof raw.vertical === "string" ? raw.vertical : null,
    trafficMode: raw.trafficMode === "block" ? "block" : "allow",
    scheduling: {
      startMode: scheduling.startMode === "scheduled" ? "scheduled" : "now",
      startDate:
        typeof scheduling.startDate === "string" ? scheduling.startDate : null,
      endMode: scheduling.endMode === "scheduled" ? "scheduled" : "forever",
      endDate: typeof scheduling.endDate === "string" ? scheduling.endDate : null,
    },
    countries: stringArray(raw.countries),
    blacklistedCountries: stringArray(raw.blacklistedCountries),
    devices: stringArray(raw.devices),
    operatingSystems: stringArray(raw.operatingSystems),
    blacklistedDevices: stringArray(raw.blacklistedDevices),
    blacklistedOperatingSystems: stringArray(raw.blacklistedOperatingSystems),
    excludeBlockedPublishers: Boolean(raw.excludeBlockedPublishers),
  };
}

export function campaignExcludesBlockedPublishers(targeting: unknown): boolean {
  return parseCampaignTargeting(targeting).excludeBlockedPublishers;
}

function formatDateLabel(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "MMM d, yyyy");
}

export function formatCampaignScheduling(targeting: ParsedCampaignTargeting) {
  const { scheduling } = targeting;
  const start =
    scheduling.startMode === "scheduled"
      ? `Starts ${formatDateLabel(scheduling.startDate) ?? "on schedule"}`
      : "Starts immediately";
  const end =
    scheduling.endMode === "scheduled"
      ? `Ends ${formatDateLabel(scheduling.endDate) ?? "on schedule"}`
      : "Runs indefinitely";
  return `${start} · ${end}`;
}

export function formatCountryList(codes: string[]) {
  if (codes.length === 0) return "All countries";
  if (codes.length <= 5) {
    return codes.map((code) => `${getCountryName(code)} (${code})`).join(", ");
  }
  return `${formatSelectedCountriesSummary(codes)} (${codes.length} selected)`;
}

export function formatListOrAll(items: string[], emptyLabel = "All") {
  if (items.length === 0) return emptyLabel;
  return items.join(", ");
}

export function buildTargetingPayload(
  base: unknown,
  updates: Partial<CampaignTargeting>,
): CampaignTargeting {
  const current = parseCampaignTargeting(base);
  return {
  ...(base && typeof base === "object" ? (base as CampaignTargeting) : {}),
    vertical: updates.vertical ?? current.vertical ?? undefined,
    trafficMode: updates.trafficMode ?? current.trafficMode,
    scheduling: updates.scheduling ?? {
      startMode: current.scheduling.startMode,
      startDate: current.scheduling.startDate,
      endMode: current.scheduling.endMode,
      endDate: current.scheduling.endDate,
    },
    countries: updates.countries ?? current.countries,
    blacklistedCountries:
      updates.blacklistedCountries ?? current.blacklistedCountries,
    devices: updates.devices ?? current.devices,
    operatingSystems: updates.operatingSystems ?? current.operatingSystems,
    blacklistedDevices: updates.blacklistedDevices ?? current.blacklistedDevices,
    blacklistedOperatingSystems:
      updates.blacklistedOperatingSystems ?? current.blacklistedOperatingSystems,
    excludeBlockedPublishers:
      updates.excludeBlockedPublishers ?? current.excludeBlockedPublishers,
    destinationUrl: current.destinationUrl ?? undefined,
    optinPageId: current.optinPageId ?? undefined,
    optinSlug: current.optinSlug ?? undefined,
  };
}