import { expect, test } from "@playwright/test";

const blockedRoutes = [
  "/jobs",
  "/demoday",
  "/contact",
  "/cofounder-matching",
  "/faq",
  "/library",
  "/press",
  "/subscribe",
  "/vcc",
] as const;

for (const route of blockedRoutes) {
  test(`${route} is blocked and redirects to home`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "EXECUTION Over EVERYTHING.", exact: true })).toBeVisible();
  });
}

test("/apply redirects unauthenticated users with return target", async ({ page }) => {
  await page.goto("/apply");
  await expect(page).toHaveURL("/login?redirect=/apply");
  await expect(page.getByRole("heading", { name: "Log in to access the SPEC Application" })).toBeVisible();
});

test("/apply/form redirects unauthenticated users with return target", async ({ page }) => {
  await page.goto("/apply/form");
  await expect(page).toHaveURL("/login?redirect=/apply/form");
  await expect(page.getByRole("heading", { name: "Log in to access the SPEC Application" })).toBeVisible();
});

test("/apply/submitted redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/apply/submitted");
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
  await expect(page.getByRole("heading", { name: "Log in to access the SPEC Application" })).toBeVisible();
});
