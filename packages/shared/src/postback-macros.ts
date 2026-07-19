export const GLOBAL_POSTBACK_MACROS = [
  { macro: "{click_id}", description: "Unique Affiliate Click Id" },
  { macro: "{payout}", description: "Payout" },
  { macro: "{currency}", description: "Currency" },
  { macro: "{aff_id}", description: "Affiliate Id" },
  { macro: "{aff_eid}", description: "Affiliate Encrypted Id" },
  { macro: "{offer_id}", description: "Offer Id" },
  { macro: "{source}", description: "Source" },
  { macro: "{date}", description: "Date" },
  { macro: "{sub1}", description: "Sub 1" },
  { macro: "{sub2}", description: "Sub 2" },
  { macro: "{sub3}", description: "Sub 3" },
  { macro: "{sub4}", description: "Sub 4" },
] as const;

export type PostbackMacroContext = {
  clickId?: string | null;
  payout?: string | number | null;
  currency?: string | null;
  affId?: string | null;
  affEid?: string | null;
  offerId?: string | null;
  source?: string | null;
  date?: string | null;
  sub1?: string | null;
  sub2?: string | null;
  sub3?: string | null;
  sub4?: string | null;
};

function asEncodedValue(value: string | number | null | undefined): string {
  if (value == null) return "";
  return encodeURIComponent(String(value));
}

/** Replace AffSense-style macros; values are URL-encoded for safe query substitution. */
export function substitutePostbackMacros(
  template: string,
  context: PostbackMacroContext,
): string {
  const map: Record<string, string> = {
    "{click_id}": asEncodedValue(context.clickId),
    "{aff_click_id}": asEncodedValue(context.clickId),
    "{payout}": asEncodedValue(context.payout),
    "{currency}": asEncodedValue(context.currency ?? "USD"),
    "{aff_id}": asEncodedValue(context.affId),
    "{aff_eid}": asEncodedValue(context.affEid ?? context.affId),
    "{offer_id}": asEncodedValue(context.offerId),
    "{source}": asEncodedValue(context.source),
    "{date}": asEncodedValue(context.date ?? new Date().toISOString().slice(0, 10)),
    "{sub1}": asEncodedValue(context.sub1),
    "{sub2}": asEncodedValue(context.sub2),
    "{sub3}": asEncodedValue(context.sub3),
    "{sub4}": asEncodedValue(context.sub4),
  };

  let result = template;
  for (const [token, value] of Object.entries(map)) {
    result = result.split(token).join(value);
  }
  return result;
}

export function injectClickIdIntoTrackingUrl(
  destination: string,
  clickId: string,
  requestOrigin: string,
): string {
  if (destination.includes("{click_id}") || destination.includes("{aff_click_id}")) {
    return destination
      .split("{click_id}")
      .join(clickId)
      .split("{aff_click_id}")
      .join(clickId);
  }

  try {
    const target = destination.startsWith("/")
      ? new URL(destination, requestOrigin)
      : new URL(destination);
    target.searchParams.set("click_id", clickId);
    return target.toString();
  } catch {
    const joiner = destination.includes("?") ? "&" : "?";
    return `${destination}${joiner}click_id=${encodeURIComponent(clickId)}`;
  }
}
