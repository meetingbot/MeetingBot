import { test, expect } from "@playwright/test";
import { randomUUID } from "crypto";

test.describe("Integration Tests", () => {
  test.describe("Google Meet Bot", () => {
    test.fixme(
      "should successfully join a Google Meet and log events",
      async ({ page, browser }) => {
        // Go to the main dashboard
        await page.goto("/");
        await page.getByRole("link", { name: "API Keys" }).click();
        await page.getByRole("button", { name: "Generate API Key" }).click();
        await page.getByRole("textbox", { name: "Name" }).fill("testing2");
        await page.getByRole("button", { name: "Create API Key" }).click();
        await page
          .getByRole("row", { name: "testing2 April 4, 2025 Active" })
          .getByRole("button")
          .click();
        await page.getByRole("menuitem", { name: "Copy Key" }).click();
        // get key from clipboard
        const key = await page.evaluate(() => navigator.clipboard.readText());
        console.log(key);

        // open new tab with google meet
        const page1 = await browser.newPage();
        await page1.goto("https://workspace.google.com/products/meet/");

        await page1
          .getByRole("link", { name: "Sign into Google Meet" })
          .nth(1)
          .click();
        await page1.getByRole("textbox", { name: "Email or phone" }).click();
        await page1
          .getByRole("textbox", { name: "Email or phone" })
          .fill("meetingbotcapstone");
        await page1
          .getByRole("textbox", { name: "Email or phone" })
          .press("Enter");
      },
    );
  });
  test.describe("Teams Bot", () => {
    test.fixme(
      "should successfully join a Teams meeting and log events",
      async ({ page, browser }) => {
        // Go to the main dashboard
        await page.goto("/");
        await page.getByRole("link", { name: "API Keys" }).click();
      },
    );
  });
  test.describe("Zoom Bot", () => {
    test.fixme(
      "should successfully join a Zoom meeting and log events",
      async ({ page, browser }) => {
        // Go to the main dashboard
        await page.goto("/");
        await page.getByRole("link", { name: "API Keys" }).click();
      },
    );
  });
});
