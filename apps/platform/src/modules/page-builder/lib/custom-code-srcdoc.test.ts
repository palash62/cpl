import { describe, expect, it } from "vitest";
import {
  buildCustomCodeSrcdoc,
  CUSTOM_CODE_DEFAULT_HTML,
  CUSTOM_CODE_RESIZE_MESSAGE,
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
    expect(doc).not.toContain("font-family: system-ui");
    expect(doc).not.toContain("box-sizing: border-box");
  });

  it("includes base margin reset and omits user style when css is empty", () => {
    const doc = buildCustomCodeSrcdoc("<p>x</p>", "", "");
    expect(doc).toContain("<style>");
    expect(doc).toContain("html, body { margin: 0; }");
    expect(doc).not.toContain("h1 { color: red; }");
  });

  it("escapes closing script tags inside js", () => {
    const doc = buildCustomCodeSrcdoc("", "", 'alert("</script>");');
    expect(doc).not.toContain('alert("</script>");');
    expect(doc).toContain('alert("<\\/script>");');
  });

  it("handles empty inputs and still injects resize reporter", () => {
    const doc = buildCustomCodeSrcdoc("", "", "");
    expect(doc).toContain("<body>");
    expect(doc).toContain(CUSTOM_CODE_RESIZE_MESSAGE);
    expect(doc).toContain("postMessage");
  });

  it("injects resize reporter after user script", () => {
    const doc = buildCustomCodeSrcdoc("<p>x</p>", "", "var a = 1;");
    expect(doc).toContain("var a = 1;");
    expect(doc).toContain(CUSTOM_CODE_RESIZE_MESSAGE);
    expect(doc.indexOf("var a = 1;")).toBeLessThan(
      doc.indexOf(CUSTOM_CODE_RESIZE_MESSAGE),
    );
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
