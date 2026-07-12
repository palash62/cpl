const ADMIN_FUNNEL_TEMPLATE_PREVIEW =
  /^\/admin\/funnel-templates\/[^/]+\/preview(\/|$)/;

const ADVERTISER_OPTIN_PREVIEW = /^\/o\/[^/]+$/;
const ADVERTISER_THANK_YOU_PREVIEW = /^\/o\/[^/]+\/thank-you$/;

export function isAdminFunnelTemplatePreviewPath(pathname: string): boolean {
  return ADMIN_FUNNEL_TEMPLATE_PREVIEW.test(pathname);
}

export function isAdvertiserFunnelPreviewRequest(
  pathname: string,
  preview: string | null,
): boolean {
  if (preview !== "1") return false;
  return (
    ADVERTISER_OPTIN_PREVIEW.test(pathname) ||
    ADVERTISER_THANK_YOU_PREVIEW.test(pathname)
  );
}

export function isPublicPreviewRequest(
  pathname: string,
  preview: string | null,
): boolean {
  return (
    isAdminFunnelTemplatePreviewPath(pathname) ||
    isAdvertiserFunnelPreviewRequest(pathname, preview)
  );
}
