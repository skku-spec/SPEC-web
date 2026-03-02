import { expect, test } from "@playwright/test";

test("/apply requires authentication", async ({ page }) => {
  await page.goto("/apply");

  await expect(page).toHaveURL("/login?redirect=/apply");
  await expect(page.getByRole("heading", { name: "Log in to access the SPEC Application" })).toBeVisible();
});

test("/apply/form requires authentication", async ({ page }) => {
  await page.goto("/apply/form");

  await expect(page).toHaveURL("/login?redirect=/apply/form");
  await expect(page.getByRole("heading", { name: "Log in to access the SPEC Application" })).toBeVisible();
});

test("/apply/submitted requires authentication", async ({ page }) => {
  await page.goto("/apply/submitted");

  await expect(page).toHaveURL(/\/login(?:\?|$)/);
  await expect(page.getByRole("heading", { name: "Log in to access the SPEC Application" })).toBeVisible();
});
