import { describe, expect, it } from "vitest";
import { sanitizeHtml, sanitizeInlineHtml } from "./sanitize";

describe("sanitizeInlineHtml", () => {
  it("strips block elements so read-only rich text is safe inside headings", () => {
    const html = "<p>Hello <strong>world</strong></p><div>nested</div>";
    expect(sanitizeInlineHtml(html)).toBe("Hello <strong>world</strong>nested");
  });

  it("keeps inline formatting tags", () => {
    const html = '<span style="color: red">Hi</span> <a href="https://x.com">link</a>';
    expect(sanitizeInlineHtml(html)).toContain('style="color: red"');
    expect(sanitizeInlineHtml("<em>one</em>")).toBe("<em>one</em>");
    expect(sanitizeInlineHtml(html)).toContain('href="https://x.com"');
  });
});

describe("sanitizeHtml", () => {
  it("allows block elements for HTML blocks", () => {
    const html = "<p>Block <div>content</div></p>";
    const clean = sanitizeHtml(html);
    expect(clean).toContain("<p>");
    expect(clean).toContain("<div>");
  });
});
