import { expect, test } from "@playwright/test";

test("login page renders core auth controls", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Log in to access the SPEC Application" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Log In" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Create an account." })).toBeVisible();
});

test("login page links to forgot-password", async ({ page }) => {
  await page.goto("/login");

  await page.getByRole("link", { name: "password?" }).click();
  await expect(page).toHaveURL("/forgot-password");
  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
});

test("signup validates short password client-side", async ({ page }) => {
  await page.goto("/signup");

  await page.getByLabel("First Name").fill("Jane");
  await page.getByLabel("Last Name").fill("Doe");
  await page.getByLabel("Email").fill("jane@example.com");
  await page.getByLabel("Username").fill("janedoe");
  await page.getByLabel("Password").fill("12345");

  await page.getByRole("button", { name: "Sign Up" }).click();
  await expect(page.getByText("Password must be at least 6 characters.")).toBeVisible();
});

test("signup validates invalid linkedin url client-side", async ({ page }) => {
  await page.goto("/signup");

  await page.getByLabel("First Name").fill("Jane");
  await page.getByLabel("Last Name").fill("Doe");
  await page.getByLabel("Email").fill("jane@example.com");
  await page.getByLabel("Username").fill("janedoe");
  await page.getByLabel("Password").fill("123456");
  await page.getByLabel(/Your LinkedIn Profile URL/).fill("https://example.com/jane");

  await page.getByRole("button", { name: "Sign Up" }).click();
  await expect(page.getByText("Please enter a valid LinkedIn profile URL.")).toBeVisible();
});

test("forgot-password page renders reset flow controls", async ({ page }) => {
  await page.goto("/forgot-password");

  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to Log in" })).toBeVisible();
});
