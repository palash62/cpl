import { test, expect } from "@playwright/test";
import {
  buildFullCoverageCraft,
  buildFullCoverageThankYouCraft,
  FULL_COVERAGE_THEME,
} from "../fixtures/full-coverage-funnel-template";
import {
  assertMarkersVisible,
  assertStyleParity,
  loginAsAdmin,
  loginAsAdvertiser,
  normalizeRgb,
  TIER_A_MARKERS,
  upsertFullCoverageTemplate,
} from "./helpers/page-builder-parity";

const FUNNEL_NAME = "Full Coverage Publish QA";
const PURPLE = "rgb(168, 85, 247)";
const CTA_PURPLE = "rgb(124, 58, 237)";

async function upsertAdvertiserFunnel(
  page: import("@playwright/test").Page,
  templateId: string,
): Promise<{ id: string; slug: string }> {
  const listRes = await page.request.get("/api/v1/advertiser/optin-funnels");
  expect(listRes.ok()).toBeTruthy();
  const listBody = await listRes.json();
  const existing = (listBody.data as Array<{ id: string; name: string; slug: string }>).find(
    (f) => f.name === FUNNEL_NAME,
  );

  let funnelId: string;
  let slug: string;

  if (existing) {
    funnelId = existing.id;
    slug = existing.slug;
  } else {
    const createRes = await page.request.post("/api/v1/advertiser/optin-funnels", {
      data: {
        name: FUNNEL_NAME,
        editorType: "BUILDER",
        pageTemplateId: templateId,
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const createBody = await createRes.json();
    funnelId = createBody.data.id as string;
    slug = createBody.data.slug as string;
  }

  const patchRes = await page.request.patch(`/api/v1/advertiser/optin-funnels/${funnelId}`, {
    data: {
      craftState: buildFullCoverageCraft(),
      themeJson: FULL_COVERAGE_THEME,
      thankYouEnabled: true,
      thankYouCraftState: buildFullCoverageThankYouCraft(),
      thankYouThemeJson: FULL_COVERAGE_THEME,
      destinationUrl: "https://example.com/thank-you",
      step: "optin",
      autosave: false,
    },
  });
  expect(patchRes.ok()).toBeTruthy();

  return { id: funnelId, slug };
}

test.describe.configure({ mode: "serial" });

test.describe("Full coverage page builder — advertiser publish", () => {
  test.setTimeout(120_000);

  test("published live page matches editor styles and markers", async ({ page }) => {
    await loginAsAdmin(page);
    const templateId = await upsertFullCoverageTemplate(page);
    await loginAsAdvertiser(page);
    const { id: funnelId, slug } = await upsertAdvertiserFunnel(page, templateId);

    await page.goto(`/advertiser/optin-funnels/${funnelId}/edit?step=optin`);
    await expect(page.getByText("Autosave on").first()).toBeVisible({ timeout: 60_000 });

    const editorHeading = page.getByRole("heading", { name: /\[BLOCK:Heading-H2\]/i });
    await expect(editorHeading).toBeVisible({ timeout: 30_000 });
    const editorHeadingColor = await editorHeading.evaluate((el) => getComputedStyle(el).color);
    expect(normalizeRgb(editorHeadingColor)).toBe(normalizeRgb(PURPLE));

    const editorCta = page.getByRole("button", { name: "[BLOCK:CtaButton]" });
    await expect(editorCta).toBeVisible();
    const editorCtaBg = await editorCta.evaluate((el) => getComputedStyle(el).backgroundColor);

    const publishRes = await page.request.post(`/api/v1/advertiser/optin-funnels/${funnelId}/publish`);
    expect(publishRes.ok()).toBeTruthy();

    await page.goto(`/o/${slug}`);
    await expect(page.locator("#pb-page")).toBeVisible({ timeout: 20_000 });

    const liveHeading = page.getByRole("heading", { name: /\[BLOCK:Heading-H2\]/i });
    await expect(liveHeading).toBeVisible();
    await assertStyleParity(editorHeading, liveHeading, "color");

    const liveCta = page.getByRole("button", { name: "[BLOCK:CtaButton]" });
    await expect(liveCta).toBeVisible();
    await assertStyleParity(editorCta, liveCta, "backgroundColor");
    expect(normalizeRgb(await liveCta.evaluate((el) => getComputedStyle(el).backgroundColor))).toBe(
      normalizeRgb(CTA_PURPLE),
    );

    await assertMarkersVisible(page, TIER_A_MARKERS.slice(0, 12));
  });

  test("draft preview matches editor after publish", async ({ page }) => {
    await loginAsAdmin(page);
    const templateId = await upsertFullCoverageTemplate(page);
    await loginAsAdvertiser(page);
    const { id: funnelId, slug } = await upsertAdvertiserFunnel(page, templateId);

    const publishRes = await page.request.post(`/api/v1/advertiser/optin-funnels/${funnelId}/publish`);
    expect(publishRes.ok()).toBeTruthy();

    await page.goto(`/advertiser/optin-funnels/${funnelId}/edit?step=optin`);
    await expect(page.getByText("Autosave on").first()).toBeVisible({ timeout: 60_000 });
    const editorHeading = page.getByRole("heading", { name: /\[BLOCK:Heading-H2\]/i });
    await expect(editorHeading).toBeVisible({ timeout: 30_000 });

    await page.goto(`/o/${slug}?preview=1`);
    await expect(page.locator("#pb-page")).toBeVisible({ timeout: 20_000 });

    const previewHeading = page.getByRole("heading", { name: /\[BLOCK:Heading-H2\]/i });
    await expect(previewHeading).toBeVisible();
    await assertStyleParity(editorHeading, previewHeading, "color");

    await assertMarkersVisible(page, [
      "[BLOCK:Paragraph]",
      "[BLOCK:CtaButton]",
      "[BLOCK:SubmitButton]",
      "[BLOCK:HtmlBlock]",
    ]);
  });
});
