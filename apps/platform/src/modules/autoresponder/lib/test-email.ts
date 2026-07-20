/** Test subscriber email for autoresponder connection tests (avoids blocked disposable domains). */
export function buildAutoresponderTestEmail(advertiserEmail?: string | null): string {
  const stamp = Date.now();
  if (advertiserEmail?.includes("@")) {
    const [local, domain] = advertiserEmail.split("@");
    if (local && domain) {
      return `${local}+cpl-test-${stamp}@${domain}`;
    }
  }
  return `cpl-test-${stamp}@example.com`;
}
