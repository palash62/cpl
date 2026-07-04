export type MergeData = Record<string, string | undefined>;

export function renderTemplate(template: string, data: MergeData): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const value = data[key];
    return value ?? "";
  });
}

export function wrapLinksForTracking(html: string, sendId: string, baseUrl: string, token: string): string {
  const trackBase = `${baseUrl}/api/v1/email/track/click/${sendId}/${token}`;
  return html.replace(
    /href="(https?:\/\/[^"]+)"/gi,
    (_, url: string) => `href="${trackBase}?url=${encodeURIComponent(url)}"`,
  );
}

export function injectTrackingPixel(html: string, pixelUrl: string): string {
  const pixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;border:0;" />`;
  if (html.includes("</body>")) {
    return html.replace("</body>", `${pixel}</body>`);
  }
  return `${html}${pixel}`;
}

export function appendUnsubscribeFooter(html: string, unsubscribeUrl: string): string {
  const footer = `<p style="font-size:12px;color:#64748b;margin-top:24px;">If you no longer wish to receive these emails, <a href="${unsubscribeUrl}">unsubscribe here</a>.</p>`;
  if (html.includes("</body>")) {
    return html.replace("</body>", `${footer}</body>`);
  }
  return `${html}${footer}`;
}
