import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = process.env.ATTENDANCE_QA_BASE_URL ?? "http://localhost:3000";
const EVIDENCE_DIR = path.resolve(".omo/ulw-loop/evidence");

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required to run attendance QA.`);
  return value;
}

const ADMIN_EMAIL = requireEnv("ATTENDANCE_QA_ADMIN_EMAIL");
const ADMIN_PASSWORD = requireEnv("ATTENDANCE_QA_ADMIN_PASSWORD");
const LEARNER_EMAIL = requireEnv("ATTENDANCE_QA_LEARNER_EMAIL");
const LEARNER_PASSWORD = requireEnv("ATTENDANCE_QA_LEARNER_PASSWORD");

function absoluteUrl(urlOrPath) {
  return new URL(urlOrPath, BASE_URL).toString();
}

function toDateTimeLocal(value) {
  const offsetMs = value.getTimezoneOffset() * 60 * 1000;
  return new Date(value.getTime() - offsetMs).toISOString().slice(0, 16);
}

async function login(page, email, password, redirectPath = "/") {
  const loginUrl = `${BASE_URL}/login?redirect=${encodeURIComponent(redirectPath)}`;
  await page.goto(loginUrl, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log In" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 30_000 });
}

async function collectOverflow(page) {
  return page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const documentOverflow = Math.max(0, document.documentElement.scrollWidth - viewportWidth);
    const visibleControls = Array.from(document.querySelectorAll("button,a")).filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
    });

    const overflowingControls = visibleControls
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const intersectsViewport = rect.right > 0 && rect.left < viewportWidth;
        return intersectsViewport && element.scrollWidth > element.clientWidth + 1;
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          text: element.textContent?.replace(/\s+/g, " ").trim().slice(0, 80) ?? "",
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          left: Math.round(rect.left),
          right: Math.round(rect.right),
        };
      });

    return {
      url: window.location.href,
      viewportWidth,
      scrollWidth: document.documentElement.scrollWidth,
      documentOverflow,
      overflowingControls,
    };
  });
}

async function ensureSessionExists(page) {
  await page.goto(`${BASE_URL}/admin/attendance`, { waitUntil: "networkidle" });
  if ((await page.getByRole("button", { name: /코드 발급|재발급/ }).count()) > 0) return;

  await page.getByPlaceholder("새 세션 (예: 5주차)").fill("운영 가이드 테스트 세션");
  await page.getByRole("button", { name: "세션 추가" }).click();
  await page.getByRole("button", { name: /코드 발급|재발급/ }).first().waitFor({ state: "visible", timeout: 15_000 });
}

async function generateCheckIn(page) {
  await ensureSessionExists(page);
  const now = new Date();
  const card = page.getByTestId("attendance-session-controls").locator("article").first();
  const dateTimeInputs = card.locator('input[type="datetime-local"]');
  await dateTimeInputs.nth(0).fill(toDateTimeLocal(new Date(now.getTime() - 5 * 60 * 1000)));
  await dateTimeInputs.nth(1).fill(toDateTimeLocal(new Date(now.getTime() - 10 * 60 * 1000)));
  await dateTimeInputs.nth(2).fill(toDateTimeLocal(new Date(now.getTime() + 20 * 60 * 1000)));
  const enabledCheckbox = card.locator('input[type="checkbox"]').first();
  if (!(await enabledCheckbox.isChecked())) await enabledCheckbox.check();
  await card.getByRole("button", { name: "저장" }).click();
  await page.waitForTimeout(1_000);

  await card.getByRole("button", { name: /코드 발급|재발급/ }).click();
  await page.getByRole("link", { name: "보드 열기" }).first().waitFor({ state: "visible", timeout: 20_000 });

  const boardPath = await page.getByRole("link", { name: "보드 열기" }).first().getAttribute("href");
  const checkInPath = await page.locator('a[href*="/dashboard/attendance/check-in"]').first().getAttribute("href");
  if (!boardPath || !checkInPath) throw new Error("Generated check-in links were not rendered.");

  return {
    boardUrl: absoluteUrl(boardPath),
    checkInUrl: absoluteUrl(checkInPath),
  };
}

async function closeCheckIn(page) {
  await page.goto(`${BASE_URL}/admin/attendance`, { waitUntil: "networkidle" });
  const closeButton = page.getByRole("button", { name: "닫기" }).first();
  if ((await closeButton.count()) === 0) return "cleanup: no close button";
  await closeButton.click();
  await page.waitForTimeout(500);
  return "cleanup: clicked first check-in close button";
}

async function runAdminResponsive() {
  await mkdir(EVIDENCE_DIR, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  try {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/admin/attendance");
    await page.goto(`${BASE_URL}/admin/attendance`, { waitUntil: "networkidle" });
    const mobile = await collectOverflow(page);
    const mobileScreenshot = path.join(EVIDENCE_DIR, "attendance-admin-mobile.png");
    await page.screenshot({ path: mobileScreenshot, fullPage: true });

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${BASE_URL}/admin/attendance`, { waitUntil: "networkidle" });
    const desktop = await collectOverflow(page);
    const desktopScreenshot = path.join(EVIDENCE_DIR, "attendance-admin-desktop.png");
    await page.screenshot({ path: desktopScreenshot, fullPage: true });

    const result = {
      scenario: "admin-responsive",
      pass:
        mobile.documentOverflow <= 1 &&
        mobile.overflowingControls.length === 0 &&
        desktop.overflowingControls.length === 0,
      mobile,
      desktop,
      screenshots: { mobile: mobileScreenshot, desktop: desktopScreenshot },
      cleanup: "browser.close",
    };
    await writeFile(path.join(EVIDENCE_DIR, "attendance-admin-responsive.json"), JSON.stringify(result, null, 2));
    if (!result.pass) {
      throw new Error(`admin-responsive overflow detected: ${JSON.stringify(result, null, 2)}`);
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

async function runLearnerAndQr() {
  await mkdir(EVIDENCE_DIR, { recursive: true });
  const browser = await chromium.launch();
  const adminContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const adminPage = await adminContext.newPage();

  let cleanupReceipt = "cleanup: browser.close";
  try {
    await login(adminPage, ADMIN_EMAIL, ADMIN_PASSWORD, "/admin/attendance");
    const { boardUrl, checkInUrl } = await generateCheckIn(adminPage);

    await adminPage.setViewportSize({ width: 1440, height: 900 });
    await adminPage.goto(boardUrl, { waitUntil: "networkidle" });
    const board = await collectOverflow(adminPage);
    const boardScreenshot = path.join(EVIDENCE_DIR, "attendance-qr-board.png");
    await adminPage.screenshot({ path: boardScreenshot, fullPage: true });

    const learnerContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const learnerPage = await learnerContext.newPage();
    await login(learnerPage, LEARNER_EMAIL, LEARNER_PASSWORD, new URL(checkInUrl).pathname + new URL(checkInUrl).search);
    await learnerPage.goto(checkInUrl, { waitUntil: "networkidle" });
    const learner = await collectOverflow(learnerPage);
    const learnerScreenshot = path.join(EVIDENCE_DIR, "attendance-learner-mobile.png");
    await learnerPage.screenshot({ path: learnerScreenshot, fullPage: true });
    await learnerContext.close();

    cleanupReceipt = await closeCheckIn(adminPage);
    const result = {
      scenario: "learner-and-qr",
      pass:
        board.documentOverflow <= 1 &&
        board.overflowingControls.length === 0 &&
        learner.documentOverflow <= 1 &&
        learner.overflowingControls.length === 0,
      board,
      learner,
      urls: { boardUrl, checkInUrl },
      screenshots: { board: boardScreenshot, learner: learnerScreenshot },
      cleanup: `${cleanupReceipt}; browser.close`,
    };
    await writeFile(path.join(EVIDENCE_DIR, "attendance-learner-qr-regression.json"), JSON.stringify(result, null, 2));
    if (!result.pass) {
      throw new Error(`learner-and-qr overflow detected: ${JSON.stringify(result, null, 2)}`);
    }
  } finally {
    await adminContext.close();
    await browser.close();
  }
}

const scenarioArgIndex = process.argv.indexOf("--scenario");
const scenario = scenarioArgIndex >= 0 ? process.argv[scenarioArgIndex + 1] : "";

if (scenario === "admin-responsive") {
  await runAdminResponsive();
} else if (scenario === "learner-and-qr") {
  await runLearnerAndQr();
} else {
  throw new Error("Usage: node scripts/attendance-guide/qa-attendance-ui.mjs --scenario admin-responsive|learner-and-qr");
}
