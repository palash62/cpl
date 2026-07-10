import { test, expect } from "@playwright/test";

test.describe("Auth pages", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("register page renders", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Create advertiser account" })).toBeVisible();
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Number")).toBeVisible();
    await expect(page.getByLabel("Address")).toBeVisible();
    await expect(page.getByLabel("Country")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/login/);
  });
});

test.describe("Public lead form", () => {
  test("shows 404 for invalid slug", async ({ page }) => {
    const response = await page.goto("/t/invalid-slug-xyz");
    expect(response?.status()).toBe(404);
  });
});
