import { test, expect } from "@playwright/test";
import {
  assertMarkersVisible,
  assertStyleParity,
  FULL_COVERAGE_TEMPLATE_NAME,
  loginAsAdmin,
  normalizeRgb,
  openPreviewPopup,
  TIER_A_MARKERS,
  THANK_YOU_MARKERS,
  upsertFullCoverageTemplate,
} from "./helpers/page-builder-parity";

const PURPLE = "rgb(168, 85, 247)";
const ORANGE = "rgb(253, 186, 116)";
const CTA_PURPLE = "rgb(124, 58, 237)";
const GOLD = "rgb(212, 175, 55)";

test.describe.configure({ mode: "serial" });

test.describe("Full coverage page builder — admin", () => {
  test.setTimeout(120_000);

  test("editor loads all tier-A block markers without crash", async ({ page }) => {
    await loginAsAdmin(page);
    const templateId = await upsertFullCoverageTemplate(page);

    await page.goto(`/admin/funnel-templates/${templateId}/edit?step=optin`);
    await expect(page.getByText("Autosave on").first()).toBeVisible({ timeout: 60_000 });

    const editorCanvas = page.locator("div.shadow-lg.ring-1").first();
    await expect(editorCanvas).toBeVisible({ timeout: 30_000 });

    await assertMarkersVisible(page, TIER_A_MARKERS.slice(0, 15));
    await assertMarkersVisible(page, TIER_A_MARKERS.slice(15));
  });

  test("preview matches editor canvas width and key block styles", async ({ page }) => {
    await loginAsAdmin(page);
    const templateId = await upsertFullCoverageTemplate(page);

    await page.goto(`/admin/funnel-templates/${templateId}/edit?step=optin`);
    await expect(page.getByText("Autosave on").first()).toBeVisible({ timeout: 60_000 });

    const editorCanvas = page.locator("div.shadow-lg.ring-1").first();
    await expect(editorCanvas).toBeVisible({ timeout: 30_000 });
    const editorMaxWidth = await editorCanvas.evaluate((el) => getComputedStyle(el).maxWidth);
    expect(editorMaxWidth).toBe("960px");

    const editorHeading = page.getByRole("heading", { name: /\[BLOCK:Heading-H2\]/i });
    await expect(editorHeading).toBeVisible();
    const editorHeadingColor = await editorHeading.evaluate((el) => getComputedStyle(el).color);
    expect(normalizeRgb(editorHeadingColor)).toBe(normalizeRgb(PURPLE));

    const editorParagraph = page.getByText("[BLOCK:Paragraph]", { exact: false }).first();
    await expect(editorParagraph).toBeVisible();
    const editorParagraphColor = await editorParagraph.evaluate((el) => getComputedStyle(el).color);
    expect(normalizeRgb(editorParagraphColor)).toBe(normalizeRgb(ORANGE));

    const editorCta = page.getByRole("button", { name: "[BLOCK:CtaButton]" });
    await expect(editorCta).toBeVisible();
    const editorCtaBg = await editorCta.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(normalizeRgb(editorCtaBg)).toBe(normalizeRgb(CTA_PURPLE));

    const editorSubmit = page.getByRole("button", { name: "[BLOCK:SubmitButton]" });
    await expect(editorSubmit).toBeVisible();
    const editorSubmitBg = await editorSubmit.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(normalizeRgb(editorSubmitBg)).toBe(normalizeRgb(GOLD));

    const previewPage = await openPreviewPopup(page);
    await expect(previewPage.getByText(FULL_COVERAGE_TEMPLATE_NAME)).toBeVisible({ timeout: 15_000 });

    const previewShell = previewPage.locator("#pb-page");
    await expect(previewShell).toBeVisible();
    const previewMaxWidth = await previewShell.evaluate((el) => getComputedStyle(el).maxWidth);
    expect(previewMaxWidth).toBe("960px");

    const previewHeading = previewPage.getByRole("heading", { name: /\[BLOCK:Heading-H2\]/i });
    await expect(previewHeading).toBeVisible();
    await assertStyleParity(editorHeading, previewHeading, "color");

    const previewParagraph = previewPage.getByText("[BLOCK:Paragraph]", { exact: false }).first();
    await expect(previewParagraph).toBeVisible();
    await assertStyleParity(editorParagraph, previewParagraph, "color");

    const previewSubmit = previewPage.getByRole("button", { name: "[BLOCK:SubmitButton]" });
    await expect(previewSubmit).toBeVisible();
    await assertStyleParity(editorSubmit, previewSubmit, "backgroundColor");
    await assertStyleParity(editorSubmit, previewSubmit, "fontSize");
    await assertStyleParity(editorSubmit, previewSubmit, "width");

    const previewCta = previewPage.getByRole("button", { name: "[BLOCK:CtaButton]" });
    await expect(previewCta).toBeVisible();
    await assertStyleParity(editorCta, previewCta, "backgroundColor");
    await assertStyleParity(editorCta, previewCta, "fontSize");
    await assertStyleParity(editorCta, previewCta, "width");

    await expect(previewPage.getByText("960px")).toBeVisible();
  });

  test("save roundtrip preserves markers after reload", async ({ page }) => {
    await loginAsAdmin(page);
    const templateId = await upsertFullCoverageTemplate(page);

    await page.goto(`/admin/funnel-templates/${templateId}/edit?step=optin`);
    await expect(page.getByText("Autosave on").first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText("[BLOCK:Heading-H2]", { exact: false }).first()).toBeVisible({
      timeout: 30_000,
    });

    await page.reload();
    await expect(page.getByText("Autosave on").first()).toBeVisible({ timeout: 60_000 });
    await assertMarkersVisible(page, [
      "[BLOCK:Heading-H2]",
      "[BLOCK:Paragraph]",
      "[BLOCK:CtaButton]",
      "[BLOCK:SubmitButton]",
      "[BLOCK:HtmlBlock]",
    ]);
  });

  test("thank-you step preview matches editor", async ({ page }) => {
    await loginAsAdmin(page);
    const templateId = await upsertFullCoverageTemplate(page);

    await page.goto(`/admin/funnel-templates/${templateId}/edit?step=thankYou`);
    await expect(page.getByText("Autosave on").first()).toBeVisible({ timeout: 60_000 });

    const editorHeading = page.getByRole("heading", { name: /\[BLOCK:ThankYou-Heading\]/i });
    await expect(editorHeading).toBeVisible({ timeout: 30_000 });
    const editorColor = await editorHeading.evaluate((el) => getComputedStyle(el).color);

    const previewPage = await openPreviewPopup(page);
    const previewHeading = previewPage.getByRole("heading", { name: /\[BLOCK:ThankYou-Heading\]/i });
    await expect(previewHeading).toBeVisible({ timeout: 15_000 });
    const previewColor = await previewHeading.evaluate((el) => getComputedStyle(el).color);
    expect(normalizeRgb(previewColor)).toBe(normalizeRgb(editorColor));

    for (const marker of THANK_YOU_MARKERS) {
      await expect(previewPage.getByText(marker, { exact: false }).first()).toBeVisible();
    }
  });

  test("preview breakpoint toolbar shows tablet width", async ({ page }) => {
    await loginAsAdmin(page);
    const templateId = await upsertFullCoverageTemplate(page);

    await page.goto(
      `/admin/funnel-templates/${templateId}/preview?frame=1&bp=tablet&step=optin`,
    );
    await expect(page.getByText(FULL_COVERAGE_TEMPLATE_NAME)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("768px")).toBeVisible();
    await expect(page.locator("#pb-page")).toBeVisible();
  });
});
