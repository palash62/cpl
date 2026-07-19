/** Backend platform shells only — not public funnels, thank-you, or marketing pages. */
export function isPlatformBackendPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/advertiser" ||
    pathname.startsWith("/advertiser/") ||
    pathname === "/publisher" ||
    pathname.startsWith("/publisher/")
  );
}
