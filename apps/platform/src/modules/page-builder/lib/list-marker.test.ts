import { describe, expect, it } from "vitest";
import {
  listAlignItemsFromTextAlign,
  parseMarkerSizePx,
  usesFlexListMarkers,
} from "./list-marker";

describe("usesFlexListMarkers", () => {
  it("uses native list for disc or unset", () => {
    expect(usesFlexListMarkers(undefined, false)).toBe(false);
    expect(usesFlexListMarkers("disc", false)).toBe(false);
    expect(usesFlexListMarkers("disc", true)).toBe(false);
  });

  it("uses flex rows for custom marker styles", () => {
    expect(usesFlexListMarkers("check", false)).toBe(true);
    expect(usesFlexListMarkers("star", true)).toBe(true);
    expect(usesFlexListMarkers("number", true)).toBe(true);
  });
});

describe("listAlignItemsFromTextAlign", () => {
  it("maps text alignment to flex align-items", () => {
    expect(listAlignItemsFromTextAlign("left")).toBe("flex-start");
    expect(listAlignItemsFromTextAlign("center")).toBe("center");
    expect(listAlignItemsFromTextAlign("right")).toBe("flex-end");
  });
});

describe("parseMarkerSizePx", () => {
  it("derives size from explicit markerSize or fontSize", () => {
    expect(parseMarkerSizePx("20px", "16px")).toBe(20);
    expect(parseMarkerSizePx(undefined, "24px")).toBe(23);
    expect(parseMarkerSizePx(undefined, undefined)).toBe(15);
  });
});
