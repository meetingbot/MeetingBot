import { test as setup, expect } from "@playwright/test";
import path from "path";
import { TOTP } from "totp-generator";
import { fileURLToPath } from "url";

// In ES modules, use this instead of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFile = path.join(__dirname, "../playwright/.auth/user.json");

setup("authenticate", async ({ page }) => {
  // Ensure auth directory exists
  const fs = await import("fs/promises");
  const authDir = path.dirname(authFile);
  await fs.mkdir(authDir, { recursive: true }).catch(() => null);

  // Perform authentication steps. Replace these actions with your own.
  await page.goto("http://localhost:3000/api/auth/signin");
  await page.waitForURL("http://localhost:3000/api/auth/signin");
  await page.getByRole("button", { name: "Sign in with GitHub" }).click();

  await page
    .getByLabel("Username or email address")
    .fill(process.env.TEST_EMAIL ?? "");
  await page.getByLabel("Password").fill(process.env.TEST_PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  const { otp } = TOTP.generate(process.env.TEST_AUTH_SECRET ?? "");
  await page.getByRole("textbox", { name: "Authentication code" }).fill(otp);

  // wait for the page to load
  await page.waitForLoadState("domcontentloaded");

  // if there's an "Authorize <whatever>" button, click it
  const authorizeButton = page.getByRole("button", {
    name: "Authorize",
  });
  if (await authorizeButton.isVisible()) {
    await authorizeButton.click();
  }

  // Wait until the page receives the cookies.
  //
  // Sometimes login flow sets cookies in the process of several redirects.
  // Wait for the final URL to ensure that the cookies are actually set.
  await page.waitForURL("http://localhost:3000");
  // Alternatively, you can wait until the page reaches a state where all cookies are set.
  // await expect(
  //   page.getByRole("button", { name: "View profile and more" }),
  // ).toBeVisible();

  // End of authentication steps.

  await page.context().storageState({ path: authFile });
});
