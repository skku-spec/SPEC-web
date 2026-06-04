import { expect, test } from "@playwright/test";

test.describe("ideathon team-building board", () => {
  test("shows the authenticated board gate without breaking the public ideathon page", async ({ page }) => {
    await page.goto("/ideathon");

    await expect(page.getByRole("heading", { name: "러너 프러너 명단" })).toBeVisible();
    await expect(page.getByText("오늘은 12월 데모데이까지 같이 가게 될 팀을 형성하는 날입니다.")).toBeVisible();
    await expect(page.getByRole("link", { name: "SPEC 계정으로 로그인" }).first()).toHaveAttribute(
      "href",
      "/login?redirect=/ideathon#team-board",
    );
    await expect(page.locator("#submit")).toBeVisible();
  });
});
