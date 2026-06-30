import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { chromium } from "playwright";

const BASE_URL = process.env.ATTENDANCE_QA_BASE_URL ?? "http://localhost:3000";
const GUIDE_DIR = path.resolve("guide");
const SCREENSHOT_DIR = path.join(GUIDE_DIR, "screenshots");
const EVIDENCE_DIR = path.resolve(".omo/ulw-loop/evidence");
const PDF_PATH = path.join(GUIDE_DIR, "attendance-qr-admin-guide.pdf");
const HTML_PATH = path.join(GUIDE_DIR, "attendance-qr-admin-guide.html");

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required to build the attendance guide.`);
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

async function captureScreenshots() {
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const adminContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const adminPage = await adminContext.newPage();

  try {
    await login(adminPage, ADMIN_EMAIL, ADMIN_PASSWORD, "/admin/attendance");
    await adminPage.goto(`${BASE_URL}/admin/attendance`, { waitUntil: "networkidle" });
    const adminAttendance = path.join(SCREENSHOT_DIR, "admin-attendance.png");
    await adminPage.screenshot({ path: adminAttendance, fullPage: true });

    const { boardUrl, checkInUrl } = await generateCheckIn(adminPage);
    const sessionSettings = path.join(SCREENSHOT_DIR, "session-settings.png");
    await adminPage.getByTestId("attendance-session-controls").screenshot({ path: sessionSettings });

    await adminPage.goto(boardUrl, { waitUntil: "networkidle" });
    const qrBoard = path.join(SCREENSHOT_DIR, "qr-board.png");
    await adminPage.screenshot({ path: qrBoard, fullPage: true });

    const learnerContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const learnerPage = await learnerContext.newPage();
    const learnerTarget = new URL(checkInUrl).pathname + new URL(checkInUrl).search;
    await login(learnerPage, LEARNER_EMAIL, LEARNER_PASSWORD, learnerTarget);
    await learnerPage.goto(checkInUrl, { waitUntil: "networkidle" });
    const learnerCheckIn = path.join(SCREENSHOT_DIR, "learner-check-in.png");
    await learnerPage.screenshot({ path: learnerCheckIn, fullPage: true });
    await learnerContext.close();

    const cleanup = await closeCheckIn(adminPage);
    return {
      screenshots: {
        "admin-attendance": adminAttendance,
        "session-settings": sessionSettings,
        "qr-board": qrBoard,
        "learner-check-in": learnerCheckIn,
      },
      urls: { boardUrl, checkInUrl },
      cleanup: `${cleanup}; browser.close`,
    };
  } finally {
    await adminContext.close();
    await browser.close();
  }
}

async function imageDataUrl(filePath) {
  const ext = path.extname(filePath).slice(1) || "png";
  const data = await readFile(filePath, "base64");
  return `data:image/${ext};base64,${data}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function buildHtml(content, capture) {
  const screenshotData = {};
  for (const slot of content.screenshotSlots) {
    screenshotData[slot] = await imageDataUrl(capture.screenshots[slot]);
  }

  const sectionHtml = content.sections
    .map((section, index) => {
      const screenshotSlot = content.screenshotSlots[index - 1];
      const screenshot = screenshotSlot
        ? `<figure><img src="${screenshotData[screenshotSlot]}" alt="${escapeHtml(section.title)} 화면 캡처" /><figcaption>${escapeHtml(section.title)} 화면 예시</figcaption></figure>`
        : "";
      const checklist = section.operatorChecklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
      return `
        <section class="page">
          <p class="eyebrow">SPEC Attendance</p>
          <h2>${escapeHtml(section.title)}</h2>
          <ul>${checklist}</ul>
          ${screenshot}
        </section>`;
    })
    .join("");

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(content.title)}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    html {
      width: 210mm;
      background: #f5f5ee;
    }
    body {
      margin: 0;
      background: #f5f5ee;
      color: #16140f;
      font-family: "Arial", "Apple SD Gothic Neo", sans-serif;
      line-height: 1.55;
    }
    .cover, .page {
      width: 210mm;
      min-height: 297mm;
      break-after: page;
      background: #ffffff;
      padding: 24mm 26mm;
    }
    .cover {
      display: flex;
      flex-direction: column;
      justify-content: center;
      border: 1px solid #ddd9cc;
    }
    .page {
      display: flex;
      flex-direction: column;
    }
    .eyebrow {
      margin: 0 0 10px;
      color: #FF6C0F;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0;
    }
    h1 {
      margin: 0;
      max-width: 620px;
      font-size: 42px;
      line-height: 1.12;
      font-weight: 800;
    }
    .subtitle {
      margin-top: 18px;
      max-width: 620px;
      color: #4a4a40;
      font-size: 15px;
    }
    h2 {
      margin: 0 0 18px;
      font-size: 26px;
      line-height: 1.22;
      font-weight: 800;
    }
    ul {
      margin: 0 0 18px;
      padding-left: 20px;
      color: #4a4a40;
      font-size: 13px;
    }
    li { margin: 0 0 8px; }
    figure {
      margin: 20px 0 0;
      padding: 10px;
      border: 1px solid #ddd9cc;
      border-radius: 8px;
      background: #fcfcf8;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    img {
      display: block;
      width: 100%;
      max-height: 162mm;
      object-fit: contain;
      border: 1px solid #ece8db;
      border-radius: 6px;
      background: white;
    }
    figcaption {
      margin-top: 8px;
      color: #6b6b5e;
      font-size: 11px;
      text-align: center;
    }
    .meta {
      margin-top: 34px;
      display: grid;
      gap: 8px;
      color: #6b6b5e;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <section class="cover">
    <p class="eyebrow">운영팀 전달 문서</p>
    <h1>${escapeHtml(content.title)}</h1>
    <p class="subtitle">매주 금요일 세션에서 운영진이 QR과 6자리 코드를 발급하고, 참석자가 직접 출석 체크하며, 운영진이 최종 출석표를 보정하는 절차를 정리했습니다.</p>
    <div class="meta">
      <span>대상: ${escapeHtml(content.audience)}</span>
      <span>사용 화면: 관리자 출석 관리, QR 보드, 참석자 출석 체크</span>
      <span>생성일: 2026-06-09</span>
    </div>
  </section>
  ${sectionHtml}
</body>
</html>`;
}

function readPdfPageCount(filePath) {
  if (!existsSync(filePath)) return 0;
  const result = spawnSync("pdfinfo", [filePath], { encoding: "utf8" });
  if (result.status !== 0) return 0;
  const match = result.stdout.match(/^Pages:\s+(\d+)/m);
  return match ? Number(match[1]) : 0;
}

async function main() {
  await mkdir(GUIDE_DIR, { recursive: true });
  await mkdir(EVIDENCE_DIR, { recursive: true });

  const content = JSON.parse(await readFile(path.join(GUIDE_DIR, "attendance-guide-content.json"), "utf8"));
  const capture = await captureScreenshots();
  const html = await buildHtml(content, capture);
  await writeFile(HTML_PATH, html);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.pdf({ path: PDF_PATH, format: "A4", printBackground: true });
  await browser.close();

  const pageCount = readPdfPageCount(PDF_PATH);
  const titlePresent = html.includes(content.title);
  const evidence = {
    pass: existsSync(PDF_PATH) && pageCount >= 4 && titlePresent,
    pdfPath: PDF_PATH,
    htmlPath: HTML_PATH,
    pageCount,
    titlePresent,
    screenshots: capture.screenshots,
    urls: capture.urls,
    cleanup: capture.cleanup,
  };
  await writeFile(path.join(EVIDENCE_DIR, "attendance-guide-pdf-build.json"), JSON.stringify(evidence, null, 2));

  if (!evidence.pass) {
    throw new Error(`PDF guide build failed: ${JSON.stringify(evidence, null, 2)}`);
  }
}

await main();
