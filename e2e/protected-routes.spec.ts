import { expect, test } from "@playwright/test";

const protectedRoutes = [
  { path: "/admin", expectedRedirect: /\/$/ },
  { path: "/admin/users", expectedRedirect: /\/$/ },
  { path: "/dashboard", expectedRedirect: /\/login(?:\?|$)/ },
  { path: "/blog/write", expectedRedirect: /\/login(?:\?|$)/ },
];

for (const route of protectedRoutes) {
  test(`${route.path} redirects unauthenticated users`, async ({ page }) => {
    await page.goto(route.path);

    await expect(page).toHaveURL(route.expectedRedirect);

    if (String(route.expectedRedirect).includes("login")) {
      await expect(
        page.getByRole("heading", { name: /Log in to access the SPEC Application/i }),
      ).toBeVisible();
    } else {
      await expect(
        page.getByRole("heading", { name: "EXECUTION Over EVERYTHING.", exact: true }),
      ).toBeVisible();
    }
  });
}
