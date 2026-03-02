import { expect, test } from "@playwright/test";
import type { ConsoleMessage, Page } from "@playwright/test";

const trackConsoleErrors = (page: Page) => {
  const consoleErrors: string[] = [];

  page.on("console", (message: ConsoleMessage) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  page.on("pageerror", (error: Error) => {
    consoleErrors.push(error.message);
  });

  return consoleErrors;
};

test("status page loads without errors for unauthenticated users", async ({ page }) => {
  const consoleErrors = trackConsoleErrors(page);

  await page.goto("/apply/status");

  await expect(page.getByRole("heading", { name: "지원 현황 확인" })).toBeVisible();
  await expect(page.getByText("지원서 제출 시 입력한 이메일과 학번으로 현재 지원 상태를 확인할 수 있습니다.")).toBeVisible();

  await page.waitForLoadState("networkidle");
  expect(consoleErrors).toEqual([]);
});

test("status check form renders correctly", async ({ page }) => {
  await page.goto("/apply/status");

  await expect(page.getByPlaceholder("지원 시 입력한 이메일")).toBeVisible();
  await expect(page.getByPlaceholder("8~10자리 숫자")).toBeVisible();
  await expect(page.getByRole("button", { name: "조회하기" })).toBeVisible();
});

test("form requires both email and student_id", async ({ page }) => {
  await page.goto("/apply/status");

  const emailInput = page.getByPlaceholder("지원 시 입력한 이메일");
  const studentIdInput = page.getByPlaceholder("8~10자리 숫자");
  const submitButton = page.getByRole("button", { name: "조회하기" });

  await emailInput.fill("test@example.com");
  await expect(submitButton).toBeDisabled();

  await emailInput.fill("");
  await studentIdInput.fill("20240001");
  await expect(submitButton).toBeDisabled();

  await emailInput.fill("test@example.com");
  await expect(submitButton).toBeEnabled();
});

test("form submission with non-existent credentials shows error", async ({ page }) => {
  await page.goto("/apply/status");

  await page.getByPlaceholder("지원 시 입력한 이메일").fill("nonexistent@test.com");
  await page.getByPlaceholder("8~10자리 숫자").fill("99999999");
  await page.getByRole("button", { name: "조회하기" }).click();

  await page.waitForLoadState("networkidle");
  await expect(page.getByText(/찾을 수 없습니다/)).toBeVisible();
});

test("back link navigates to apply page", async ({ page }) => {
  await page.goto("/apply/status");

  await page.getByRole("link", { name: "← 지원 페이지로 돌아가기" }).click();

  await expect(page).toHaveURL("/login?redirect=/apply");
});

test("no console errors during interaction", async ({ page }) => {
  const consoleErrors = trackConsoleErrors(page);

  await page.goto("/apply/status");

  await page.getByPlaceholder("지원 시 입력한 이메일").fill("nonexistent@test.com");
  await page.getByPlaceholder("8~10자리 숫자").fill("99999999");
  await page.getByRole("button", { name: "조회하기" }).click();

  await page.waitForLoadState("networkidle");
  expect(consoleErrors).toEqual([]);
});
