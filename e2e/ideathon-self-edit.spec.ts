import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";

test("ideathon page keeps unauthenticated submission regression stable", async ({ page }) => {
  const consoleErrors: string[] = [];
  await mkdir(".omo/ulw-loop/evidence", { recursive: true });

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });

  const response = await page.goto("/ideathon");

  expect(response, "/ideathon should return a response").not.toBeNull();
  expect(response?.ok(), "/ideathon should return OK").toBeTruthy();

  await page.locator("#submit").scrollIntoViewIfNeeded();
  await expect(page.getByRole("link", { name: "SPEC 계정으로 로그인" })).toBeVisible();
  await expect(page.getByRole("button", { name: "아이디어 제출하기" })).toHaveCount(0);
  await expect(page.locator('textarea[name="description"]')).toHaveCount(0);

  await page.screenshot({ path: ".omo/ulw-loop/evidence/G001-C003-browser.png", fullPage: true });
  await page.waitForLoadState("networkidle");
  expect(consoleErrors).toEqual([]);
});
