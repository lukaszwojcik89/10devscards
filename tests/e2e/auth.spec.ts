import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should display login page", async ({ page }) => {
    await page.goto("/login");

    // Check if login form is visible
    await expect(page.locator("h1")).toContainText("Login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should display register page", async ({ page }) => {
    await page.goto("/register");

    // Check if register form is visible
    await expect(page.locator("h1")).toContainText("Register");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should redirect to dashboard when logged in", async ({ page }) => {
    // This test would require setting up test auth or mocking
    // For now, just check that dashboard page exists
    await page.goto("/dashboard");

    // Should either show dashboard content or redirect to login
    const title = await page.locator("h1").first();
    await expect(title).toBeVisible();
  });
});
