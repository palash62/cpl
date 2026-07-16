import { expect, type Locator, type Page } from "@playwright/test";
import {
  buildFullCoverageCraft,
  buildFullCoverageThankYouCraft,
  FULL_COVERAGE_TEMPLATE_NAME,
  FULL_COVERAGE_THEME,
  TIER_A_MARKERS,
  THANK_YOU_MARKERS,
} from "../../fixtures/full-coverage-funnel-template";

export const ADMIN_EMAIL = "admin@cpl.local";
export const ADMIN_PASSWORD = "password123";
export const ADVERTISER_EMAIL = "advertiser@cpl.local";
export const ADVERTISER_PASSWORD = "password123";

export function normalizeRgb(color: string) {
  return color.replace(/\s+/g, "");
}

async function completePasswordOtpLogin(
  page: Page,
  email: string,
  password: string,
  dashboardPattern: RegExp,
) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Verification code").waitFor({ timeout: 30_000 });

  const otpRes = await page.request.post("/api/test/login-otp", {
    data: { email },
  });
  expect(otpRes.ok()).toBeTruthy();
  const otpBody = await otpRes.json();
  await page.getByLabel("Verification code").fill(otpBody.code);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(dashboardPattern, { timeout: 30_000 });
}

export async function loginAsAdmin(page: Page) {
  await completePasswordOtpLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD, /\/admin/);
}

export async function loginAsAdvertiser(page: Page) {
  await completePasswordOtpLogin(page, ADVERTISER_EMAIL, ADVERTISER_PASSWORD, /\/advertiser/);
}

export async function upsertFullCoverageTemplate(page: Page): Promise<string> {
  const listRes = await page.request.get("/api/v1/admin/optin-funnel-templates");
  expect(listRes.ok()).toBeTruthy();
  const listBody = await listRes.json();
  const existing = (listBody.data as Array<{ id: string; name: string }>).find(
    (t) => t.name === FULL_COVERAGE_TEMPLATE_NAME,
  );

  let templateId: string;
  if (existing) {
    templateId = existing.id;
  } else {
    const createRes = await page.request.post("/api/v1/admin/optin-funnel-templates", {
      data: {
        name: FULL_COVERAGE_TEMPLATE_NAME,
        primaryColor: FULL_COVERAGE_THEME.primaryColor,
        secondaryColor: FULL_COVERAGE_THEME.secondaryColor,
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const createBody = await createRes.json();
    templateId = createBody.data.id as string;
  }

  const patchRes = await page.request.patch(`/api/v1/admin/optin-funnel-templates/${templateId}`, {
    data: {
      craftState: buildFullCoverageCraft(),
      themeJson: FULL_COVERAGE_THEME,
      thankYouEnabled: true,
      thankYouCraftState: buildFullCoverageThankYouCraft(),
      thankYouThemeJson: FULL_COVERAGE_THEME,
      step: "optin",
      autosave: false,
    },
  });
  expect(patchRes.ok()).toBeTruthy();
  return templateId;
}

export async function assertMarkersVisible(page: Page, markers: string[]) {
  for (const marker of markers) {
    await expect(page.getByText(marker, { exact: false }).first()).toBeVisible({ timeout: 20_000 });
  }
}

export async function assertStyleParity(
  editorLocator: Locator,
  previewLocator: Locator,
  property: "color" | "backgroundColor" | "fontSize" | "width",
) {
  const editorValue = await editorLocator.evaluate((el, prop) => getComputedStyle(el)[prop], property);
  const previewValue = await previewLocator.evaluate((el, prop) => getComputedStyle(el)[prop], property);
  if (property === "fontSize" || property === "width") {
    expect(previewValue).toBe(editorValue);
    return;
  }
  expect(normalizeRgb(previewValue)).toBe(normalizeRgb(editorValue));
}

export async function assertOffsetWidthParity(editorLocator: Locator, previewLocator: Locator) {
  const editorWidth = await editorLocator.evaluate((el) => (el as HTMLElement).offsetWidth);
  const previewWidth = await previewLocator.evaluate((el) => (el as HTMLElement).offsetWidth);
  expect(previewWidth).toBe(editorWidth);
}

export async function openPreviewPopup(editorPage: Page) {
  const popupPromise = editorPage.waitForEvent("popup", { timeout: 90_000 });
  await editorPage.getByRole("button", { name: "Preview" }).click();
  const previewPage = await popupPromise;
  await previewPage.waitForLoadState("domcontentloaded");
  return previewPage;
}

export { TIER_A_MARKERS, THANK_YOU_MARKERS, FULL_COVERAGE_TEMPLATE_NAME };
