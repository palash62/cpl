import { test, expect } from "@playwright/test";

const MOBILE_VIEWPORT = { width: 390, height: 844 };

test.describe("Marketing homepage mobile", () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test("renders without horizontal overflow and shows mobile navigation", async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /Verified Leads/i }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Why Pay \$5\+ Per Lead/i })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Stop Buying Clicks\. Start Buying/i }),
    ).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(MOBILE_VIEWPORT.width);

    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
    await expect(page.locator(".vslLanding .navlinks")).toBeHidden();

    const featuresColumnCount = await page.locator(".vslLanding .features").evaluate((el) => {
      return getComputedStyle(el).gridTemplateColumns.split(" ").length;
    });
    expect(featuresColumnCount).toBe(1);
  });
});
