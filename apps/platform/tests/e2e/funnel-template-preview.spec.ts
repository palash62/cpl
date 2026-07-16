import { test, expect, type Page } from "@playwright/test";
import {
  buildWysiwygTestCraft,
  WYSIWYG_TEST_TEMPLATE_NAME,
  WYSIWYG_TEST_THEME,
} from "../fixtures/wysiwyg-funnel-template";

const ADMIN_EMAIL = "admin@cpl.local";
const ADMIN_PASSWORD = "password123";
const GOLD = "rgb(212, 175, 55)";
const GREEN = "rgb(34, 197, 94)";

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Verification code").waitFor({ timeout: 30_000 });

  const otpRes = await page.request.post("/api/test/login-otp", {
    data: { email: ADMIN_EMAIL },
  });
  expect(otpRes.ok()).toBeTruthy();
  const otpBody = await otpRes.json();
  await page.getByLabel("Verification code").fill(otpBody.code);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/admin/, { timeout: 30_000 });
}

function normalizeRgb(color: string) {
  return color.replace(/\s+/g, "");
}

async function createTestTemplate(page: Page): Promise<string> {
  const listRes = await page.request.get("/api/v1/admin/optin-funnel-templates");
  expect(listRes.ok()).toBeTruthy();
  const listBody = await listRes.json();
  const existing = (listBody.data as Array<{ id: string; name: string }>).find(
    (t) => t.name === WYSIWYG_TEST_TEMPLATE_NAME,
  );

  let templateId: string;
  if (existing) {
    templateId = existing.id;
  } else {
    const createRes = await page.request.post("/api/v1/admin/optin-funnel-templates", {
      data: {
        name: WYSIWYG_TEST_TEMPLATE_NAME,
        primaryColor: WYSIWYG_TEST_THEME.primaryColor,
        secondaryColor: WYSIWYG_TEST_THEME.secondaryColor,
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const createBody = await createRes.json();
    templateId = createBody.data.id as string;
  }

  const patchRes = await page.request.patch(`/api/v1/admin/optin-funnel-templates/${templateId}`, {
    data: {
      craftState: buildWysiwygTestCraft(),
      themeJson: WYSIWYG_TEST_THEME,
      step: "optin",
      autosave: false,
    },
  });
  expect(patchRes.ok()).toBeTruthy();
  return templateId;
}

test.describe("Admin funnel template WYSIWYG preview", () => {
  test("preview matches editor canvas width, heading color, and button color", async ({ page }) => {
    await loginAsAdmin(page);
    const templateId = await createTestTemplate(page);

    await page.goto(`/admin/funnel-templates/${templateId}/edit?step=optin`);
    await expect(page.getByText("Autosave on").first()).toBeVisible({ timeout: 60_000 });

    const editorCanvas = page.locator("div.shadow-lg.ring-1").first();
    await expect(editorCanvas).toBeVisible({ timeout: 20_000 });
    const editorMaxWidth = await editorCanvas.evaluate((el) => getComputedStyle(el).maxWidth);
    expect(editorMaxWidth).toBe("960px");

    const editorHeading = page.getByRole("heading", { name: /Online Business System/i });
    await expect(editorHeading).toBeVisible();
    const editorHeadingColor = await editorHeading.evaluate((el) => getComputedStyle(el).color);
    expect(normalizeRgb(editorHeadingColor)).toBe(normalizeRgb(GREEN));

    const editorButton = page.getByRole("button", { name: "Get Instant Access" });
    await expect(editorButton).toBeVisible();
    const editorButtonBg = await editorButton.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(normalizeRgb(editorButtonBg)).toBe(normalizeRgb(GOLD));

    await page.getByRole("button", { name: "Preview" }).click();
    const previewPage = await page.waitForEvent("popup");
    await previewPage.waitForLoadState("domcontentloaded");
    await expect(previewPage.getByText(WYSIWYG_TEST_TEMPLATE_NAME)).toBeVisible({ timeout: 15_000 });

    const previewShell = previewPage.locator("#pb-page");
    await expect(previewShell).toBeVisible();
    const previewMaxWidth = await previewShell.evaluate((el) => getComputedStyle(el).maxWidth);
    expect(previewMaxWidth).toBe("960px");

    const previewHeading = previewPage.getByRole("heading", { name: /Online Business System/i });
    await expect(previewHeading).toBeVisible();
    const previewHeadingColor = await previewHeading.evaluate((el) => getComputedStyle(el).color);
    expect(normalizeRgb(previewHeadingColor)).toBe(normalizeRgb(GREEN));
    expect(normalizeRgb(previewHeadingColor)).toBe(normalizeRgb(editorHeadingColor));

    const previewButton = previewPage.getByRole("button", { name: "Get Instant Access" });
    await expect(previewButton).toBeVisible();
    const previewButtonBg = await previewButton.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(normalizeRgb(previewButtonBg)).toBe(normalizeRgb(GOLD));
    expect(normalizeRgb(previewButtonBg)).toBe(normalizeRgb(editorButtonBg));

    await expect(previewPage.getByText("960px")).toBeVisible();
  });
});
