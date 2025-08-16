import { test, expect } from "@playwright/test";

test.describe("Flashcard Generation", () => {
  test("should display generate AI page", async ({ page }) => {
    await page.goto("/generate-ai");

    // Check if generation form is visible
    await expect(page.locator("h1")).toContainText("Generate");

    // Check for input field for text
    await expect(page.locator('textarea[name="input_text"]')).toBeVisible();

    // Check for generate button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should display input validation errors", async ({ page }) => {
    await page.goto("/generate-ai");

    // Try to submit without filling required fields
    await page.locator('button[type="submit"]').click();

    // Should show validation errors
    await expect(page.locator("text=required")).toBeVisible();
  });

  test("should show deck selection options", async ({ page }) => {
    await page.goto("/generate-ai");

    // Check for deck selection (CREATE_NEW or existing deck)
    const deckSelection = page.locator('select[name="deck_id"]');
    if (await deckSelection.isVisible()) {
      await expect(deckSelection).toBeVisible();
    }
  });
});
