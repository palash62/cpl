import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "u", "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "a", "span", "div", "img", "blockquote",
];

const ALLOWED_ATTR = ["href", "src", "alt", "title", "class", "target", "rel"];

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}

const EMBED_ALLOWLIST = [
  "youtube.com",
  "www.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
  "vimeo.com",
];

export function sanitizeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    const host = parsed.hostname.toLowerCase();
    if (!EMBED_ALLOWLIST.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function sanitizeCustomCss(css: string, scopeId: string): string {
  const stripped = css.replace(/@import/gi, "").replace(/javascript:/gi, "").replace(/expression\s*\(/gi, "");
  return `#${scopeId} { ${stripped} }`;
}
