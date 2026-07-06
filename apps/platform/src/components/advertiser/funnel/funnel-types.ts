export type FunnelStepId = "optin" | "thankYou";

export type FunnelStepItem = {
  id: FunnelStepId;
  name: string;
  path: string;
  enabled: boolean;
};

export function buildFunnelSteps(thankYouEnabled: boolean): FunnelStepItem[] {
  return [
    { id: "optin", name: "optin page", path: "", enabled: true },
    { id: "thankYou", name: "thank you", path: "thank-you", enabled: thankYouEnabled },
  ];
}

export function funnelStepCount(thankYouEnabled: boolean): number {
  return thankYouEnabled ? 2 : 1;
}

export function formatFunnelDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
