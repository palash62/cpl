/** Inbound CPA postback click id parsing (shared by tracking handler + tests). */

const PLACEHOLDER_MACROS = new Set([
  "{click_id}",
  "{aff_click_id}",
  "[click_id]",
  "[aff_click_id]",
]);

export type InboundClickIdFailure = "missing" | "placeholder" | "unknown";

export function normalizeClickId(clickIdRaw: string | null | undefined): string | null {
  if (!clickIdRaw) return null;
  const trimmed = clickIdRaw.trim();
  if (!trimmed || PLACEHOLDER_MACROS.has(trimmed)) return null;
  return trimmed.slice(0, 191);
}

export function resolveInboundClickId(
  getParam: (key: string) => string | null,
): string | null {
  return normalizeClickId(getParam("click_id") ?? getParam("aff_click_id"));
}

export function inboundClickIdErrorMessage(failure: InboundClickIdFailure): string {
  switch (failure) {
    case "missing":
      return "click_id is required. Use click_id or aff_click_id with a real platform click id from a CPA tracking link.";
    case "placeholder":
      return "Replace the {click_id} or [click_id] macro with a real platform click id before firing this postback.";
    case "unknown":
      return "Unknown click_id. Visit a CPA offer tracking link first to generate a click, then use that id.";
  }
}
