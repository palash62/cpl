/** Detect whether stored text already contains HTML markup. */
export function isHtmlContent(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}

/** Strip HTML tags for plain-text settings panel fallback. */
export function stripHtmlToPlain(value: string): string {
  if (!value) return "";
  if (!isHtmlContent(value)) return value;
  return value.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim();
}
