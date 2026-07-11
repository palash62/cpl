import { describe, expect, it } from "vitest";
import { craftResolver } from "@/modules/page-builder/blocks/index";
import { ensureEditorCraftState, normalizeCraftState } from "@/modules/page-builder/lib/serialize";
import { nodeTypeName } from "../fixtures/craft-node";
import {
  ALL_RESOLVER_NAMES,
  BLOCK_MARKERS,
  buildFullCoverageCraft,
  buildFullCoverageThankYouCraft,
  collectResolverNamesInCraft,
  CRAFT_JSON_MARKERS,
} from "../fixtures/full-coverage-funnel-template";

describe("full coverage craft fixture", () => {
  const optinCraft = buildFullCoverageCraft();
  const thankYouCraft = buildFullCoverageThankYouCraft();
  const combinedNames = collectResolverNamesInCraft(
    Object.assign({}, optinCraft, thankYouCraft),
  );

  it("every node has a valid resolver name", () => {
    const resolverKeys = new Set(Object.keys(craftResolver));
    for (const [id, node] of Object.entries(optinCraft)) {
      const name = nodeTypeName(node);
      expect(name, `node ${id}`).toBeTruthy();
      expect(resolverKeys.has(name), `resolver for ${name}`).toBe(true);
    }
  });

  it("covers all 51 craft resolver block types", () => {
    const missing = ALL_RESOLVER_NAMES.filter((name) => !combinedNames.has(name));
    expect(missing, `missing block types: ${missing.join(", ")}`).toEqual([]);
    expect(combinedNames.size).toBeGreaterThanOrEqual(ALL_RESOLVER_NAMES.length);
  });

  it("normalizeCraftState preserves all nodes", () => {
    const normalized = normalizeCraftState(optinCraft);
    expect(Object.keys(normalized).length).toBe(Object.keys(optinCraft).length);
  });

  it("ensureEditorCraftState keeps full coverage document", () => {
    const ensured = ensureEditorCraftState(optinCraft);
    expect(Object.keys(ensured).length).toBeGreaterThan(10);
    expect(ensured.ROOT).toBeDefined();
  });

  it("craft JSON markers are embedded in optin craft", () => {
    const serialized = JSON.stringify(optinCraft);
    for (const marker of CRAFT_JSON_MARKERS) {
      expect(serialized, `missing marker ${marker}`).toContain(marker);
    }
  });

  it("thank-you craft includes thank-you markers", () => {
    const serialized = JSON.stringify(thankYouCraft);
    expect(serialized).toContain("[BLOCK:ThankYou-Heading]");
    expect(serialized).toContain("[BLOCK:ThankYou-Cta]");
  });
});
