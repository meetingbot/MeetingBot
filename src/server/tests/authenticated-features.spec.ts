import { test, expect } from "@playwright/test";
import { randomUUID } from "crypto";

// These tests run with authentication
test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test.describe("Authenticated Features", () => {
  test.describe("Dashboard", () => {
    test("should show user's name", async ({ page }) => {
      await expect(page.locator("h1")).toContainText("meetingbotcapstone");
    });
  });

  test.describe("API Key Management", () => {
    test("should create and revoke API key", async ({ page }) => {
      const keyName = randomUUID();
      await page.getByRole("link", { name: "API Keys" }).click();

      await page.getByRole("button", { name: "Generate API Key" }).click();
      await page.getByRole("textbox", { name: "Name" }).fill(keyName);
      await page.getByRole("button", { name: "Create API Key" }).click();

      const row = page.getByRole("row", { name: keyName });
      await expect(row).toContainText("Active");
      await row.getByRole("button", { name: "Open menu" }).click();
      await page.getByRole("menuitem", { name: "Revoke Key" }).click();
      await expect(row).toContainText("Revoked");
    });
  });

  test.describe("Bot Management", () => {
    test("can view bots", async ({ page }) => {
      await page.getByRole("link", { name: "Bots", exact: true }).click();
      await expect(page.locator("thead")).toContainText("Platform");
    });
  });

  test.describe("Usage", () => {
    test("can view usage", async ({ page }) => {
      await page.getByRole("link", { name: "Usage", exact: true }).click();
      await expect(page.locator("body")).toContainText("Time Span");
    });
  });
});
