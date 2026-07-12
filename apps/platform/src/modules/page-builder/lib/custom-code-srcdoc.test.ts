import { describe, expect, it } from "vitest";
import {
  buildCustomCodeSrcdoc,
  CUSTOM_CODE_DEFAULT_HTML,
  hasCustomCodeContent,
} from "./custom-code-srcdoc";

describe("buildCustomCodeSrcdoc", () => {
  it("wraps html, css, and js in a full document", () => {
    const doc = buildCustomCodeSrcdoc(
      "<h1>Hello</h1>",
      "h1 { color: red; }",
      "console.log('hi');",
    );
    expect(doc).toContain("<!DOCTYPE html>");
    expect(doc).toContain('<meta name="viewport"');
    expect(doc).toContain("<h1>Hello</h1>");
    expect(doc).toContain("h1 { color: red; }");
    expect(doc).toContain("console.log('hi');");
  });

  it("escapes closing script tags inside js", () => {
    const doc = buildCustomCodeSrcdoc("", "", 'alert("</script>");');
    expect(doc).not.toContain('alert("</script>");');
    expect(doc).toContain('alert("<\\/script>");');
  });

  it("handles empty inputs", () => {
    const doc = buildCustomCodeSrcdoc("", "", "");
    expect(doc).toContain("<body>");
    expect(doc).not.toContain("<script>");
  });

  it("preserves default starter html", () => {
    const doc = buildCustomCodeSrcdoc(CUSTOM_CODE_DEFAULT_HTML, "", "");
    expect(doc).toContain("custom-code-block");
  });
});

describe("hasCustomCodeContent", () => {
  it("returns false when all strings are empty", () => {
    expect(hasCustomCodeContent("", "", "")).toBe(false);
  });

  it("returns true when any field has content", () => {
    expect(hasCustomCodeContent("", "body {}", "")).toBe(true);
    expect(hasCustomCodeContent("<p>x</p>", "", "")).toBe(true);
    expect(hasCustomCodeContent("", "", "x=1")).toBe(true);
  });
});
