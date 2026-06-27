export const PIXEL_QUERY_PARAMS = [
  { token: "{lead_id}", description: "Lead ID from the platform" },
  { token: "{txn_id}", description: "Your transaction or order ID" },
] as const;

export function buildPixelUrl(origin: string, pixelToken: string) {
  const base = `${origin.replace(/\/$/, "")}/api/v1/pixel/${pixelToken}`;
  return `${base}?lead_id={lead_id}&txn_id={txn_id}`;
}

export function buildPixelSnippet(pixelUrl: string) {
  return `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none" />`;
}
