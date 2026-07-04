export const PIXEL_QUERY_PARAMS = [
  { token: "{lead_id}", description: "Lead ID from the platform" },
  { token: "{txn_id}", description: "Your transaction or order ID" },
] as const;

export {
  buildPixelUrl,
  buildPixelSnippet,
  buildTrackingScriptUrl,
  getPlatformUrl,
  getTrackingUrl,
} from "@cpl/shared";
