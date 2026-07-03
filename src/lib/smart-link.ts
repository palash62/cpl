/** Preset platform source values for Smart Link tracking */
export const SMART_LINK_PLATFORMS = [
  { id: "facebook", label: "Facebook", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "instagram", label: "Instagram", color: "bg-pink-50 text-pink-700 border-pink-200" },
  { id: "tiktok", label: "TikTok", color: "bg-slate-50 text-slate-800 border-slate-200" },
  { id: "youtube", label: "YouTube", color: "bg-red-50 text-red-700 border-red-200" },
  { id: "x", label: "X (Twitter)", color: "bg-sky-50 text-sky-700 border-sky-200" },
  { id: "whatsapp", label: "WhatsApp", color: "bg-green-50 text-green-700 border-green-200" },
  { id: "telegram", label: "Telegram", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  { id: "other", label: "Other", color: "bg-violet-50 text-violet-700 border-violet-200" },
] as const;

export type SmartLinkPlatformId = (typeof SMART_LINK_PLATFORMS)[number]["id"];

const TRACKING_PARAM_RE = /^[a-zA-Z0-9_-]{1,32}$/;

export function sanitizeTrackingParam(value: string | null | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  const trimmed = value.trim().toLowerCase();
  return TRACKING_PARAM_RE.test(trimmed) ? trimmed : undefined;
}

export function buildSmartLinkUrl(
  baseUrl: string,
  params?: { src?: string; subId?: string },
): string {
  const isAbsolute = /^https?:\/\//i.test(baseUrl);
  const url = isAbsolute ? new URL(baseUrl) : new URL(baseUrl, "http://localhost");
  if (params?.src) url.searchParams.set("src", params.src);
  if (params?.subId) url.searchParams.set("sub_id", params.subId);
  const query = url.search;
  const path = url.pathname;
  return isAbsolute ? url.toString() : `${path}${query}`;
}
