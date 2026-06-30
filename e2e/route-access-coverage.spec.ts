import { expect, test } from "@playwright/test";

const blockedRoutes = [
  "/demoday",
  "/contact",
  "/cofounder-matching",
  "/faq",
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

test("/dashboard/attendance/check-in redirects unauthenticated users with QR return target", async ({ page }) => {
  await page.goto("/dashboard/attendance/check-in?session=session-1&code=482193");
  await expect(page).toHaveURL(
    /\/login\?redirect=%2Fdashboard%2Fattendance%2Fcheck-in%3Fsession%3Dsession-1%26code%3D482193$/,
  );
  await expect(page.getByRole("heading", { name: "Log in to access the SPEC Application" })).toBeVisible();
});
