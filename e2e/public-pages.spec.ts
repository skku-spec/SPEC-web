import { expect, test } from "@playwright/test";

type PublicPageCase = {
  name: string;
  path: string;
  heading: RegExp;
  title?: RegExp;
};

const publicPages: PublicPageCase[] = [
  {
    name: "home page",
    path: "/",
    heading: /EXECUTION Over EVERYTHING\./,
    title: /SKKU SPEC \| 성균관대학교 창업 학회/i,
  },
  {
    name: "about page",
    path: "/about",
    heading: /What Happens at SPEC/i,
  },
  {
    name: "blog page",
    path: "/blog",
    heading: /SPEC Stories/i,
  },
];

for (const pageCase of publicPages) {
  test(`${pageCase.name} loads without console errors`, async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    page.on("pageerror", (error) => {
      consoleErrors.push(error.message);
    });

    const response = await page.goto(pageCase.path);

    expect(response, `${pageCase.path} should return a response`).not.toBeNull();
    expect(response?.ok(), `${pageCase.path} should return an OK response`).toBeTruthy();

    await expect(page).toHaveURL(pageCase.path);

    if (pageCase.title) {
      await expect(page).toHaveTitle(pageCase.title);
    }

    if (pageCase.path === "/") {
      await expect(
        page.getByRole("heading", { name: "EXECUTION Over EVERYTHING.", exact: true }),
      ).toBeVisible();
    } else {
      await expect(page.getByRole("heading", { name: pageCase.heading })).toBeVisible();
    }

    await page.waitForLoadState("networkidle");
    expect(consoleErrors).toEqual([]);
  });
}
