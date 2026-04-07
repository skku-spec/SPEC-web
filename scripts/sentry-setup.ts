import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const TIMEOUT = 5 * 60 * 1000;

async function main() {
  const evidenceDir = path.join(process.cwd(), '.sisyphus', 'evidence');
  fs.mkdirSync(evidenceDir, { recursive: true });

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    channel: 'chrome',
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const context = await browser.newContext();
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  });
  const page = await context.newPage();

  console.log('\n=== SENTRY SETUP ===');
  console.log('Opening Sentry login page...');
  console.log('👉 Please log in to Sentry in the browser window that just opened.');
  console.log('   The script will continue automatically after you log in.\n');

  await page.goto('https://sentry.io/auth/login/');
  // Wait for any post-login page (onboarding, dashboard, organizations, etc.)
  await page.waitForFunction(
    () => {
      const u = location.href;
      return (
        !u.includes('/auth/login') &&
        !u.includes('accounts.google.com') &&
        !u.includes('/auth/') &&
        u.includes('sentry.io')
      );
    },
    { timeout: TIMEOUT }
  );

  console.log(`✅ Login detected! Current URL: ${page.url()}`);
  await page.screenshot({ path: path.join(evidenceDir, 'task-0-browser-login.png') });

  let orgSlug: string | null = null;
  const urlAfterLogin = page.url();
  const orgMatchPath = urlAfterLogin.match(/organizations\/([^/?#]+)/);
  const orgMatchSubdomain = urlAfterLogin.match(/https?:\/\/([^.]+)\.sentry\.io/);
  orgSlug = (orgMatchPath ? orgMatchPath[1] : null) ?? (orgMatchSubdomain ? orgMatchSubdomain[1] : null);

  if (!orgSlug) throw new Error('Could not extract org slug. URL: ' + urlAfterLogin);
  console.log(`✅ Logged in! Org: ${orgSlug}`);

  await page.screenshot({ path: path.join(evidenceDir, 'task-0-browser-login.png') });

  console.log('\nCreating project "spec-web"...');
  await page.goto(`https://sentry.io/settings/${orgSlug}/projects/`);
  await page.waitForLoadState('networkidle');

  const createBtn = page
    .getByRole('button', { name: /create project/i })
    .or(page.locator('a[href*="create"]').filter({ hasText: /create/i }))
    .first();
  await createBtn.click();

  await page.waitForLoadState('networkidle');
  await page.getByText('Next.js').first().click();

  const nameInput = page
    .getByLabel(/project name/i)
    .or(page.locator('input[name*="name"]'))
    .first();
  await nameInput.clear();
  await nameInput.fill('spec-web');

  const submitBtn = page.getByRole('button', { name: /create project/i }).last();
  await submitBtn.click();
  await page.waitForLoadState('networkidle');

  await page.screenshot({ path: path.join(evidenceDir, 'task-0-project-created.png') });

  let dsn = '';
  const dsnPatterns = [
    page.locator('text=/https:\\/\\/[a-f0-9]+@[^\\s"]+\\.ingest\\.sentry\\.io\\/[0-9]+/'),
    page.locator('[data-dsn]'),
    page.locator('code').filter({ hasText: 'ingest.sentry.io' }),
  ];

  for (const locator of dsnPatterns) {
    try {
      const text = await locator.first().textContent({ timeout: 5000 });
      const match = text?.match(/https:\/\/[a-f0-9]+@[^'"\s]+\.ingest\.sentry\.io\/\d+/);
      if (match) {
        dsn = match[0];
        break;
      }
    } catch {}
  }

  if (!dsn) {
    await page.goto(`https://sentry.io/settings/${orgSlug}/projects/spec-web/keys/`);
    await page.waitForLoadState('networkidle');
    const dsnEl = page.locator('text=/https:\\/\\/[a-f0-9]+@/').first();
    const text = await dsnEl.textContent({ timeout: 10000 });
    const match = text?.match(/https:\/\/[a-f0-9]+@[^'"\s]+\.ingest\.sentry\.io\/\d+/);
    if (match) dsn = match[0];
  }

  if (!dsn) throw new Error('Failed to extract DSN');
  console.log('✅ DSN extracted');

  console.log('\nCreating Auth Token...');
  await page.goto(`https://sentry.io/settings/${orgSlug}/developer-settings/new-internal/`);
  try {
    await page.waitForLoadState('networkidle');
  } catch {}

  await page.goto(`https://sentry.io/orgredirect/organizations/${orgSlug}/settings/auth-tokens/`);
  await page.waitForLoadState('networkidle');

  const newTokenBtn = page
    .getByRole('button', { name: /create new token/i })
    .or(page.getByRole('link', { name: /create new token/i }))
    .first();
  await newTokenBtn.click();
  await page.waitForLoadState('networkidle');

  const scopeCheckboxes = [
    page.locator('input[value="project:releases"]').or(page.getByLabel('project:releases')),
    page.locator('input[value="org:read"]').or(page.getByLabel('org:read')),
  ];
  for (const checkbox of scopeCheckboxes) {
    try {
      const target = checkbox.first();
      const checked = await target.isChecked({ timeout: 3000 });
      if (!checked) await target.check();
    } catch {}
  }

  const createTokenBtn = page
    .getByRole('button', { name: /create token/i })
    .or(page.getByRole('button', { name: /save/i }))
    .first();
  await createTokenBtn.click();
  await page.waitForLoadState('networkidle');

  await page.screenshot({ path: path.join(evidenceDir, 'task-0-token-created.png') });

  let authToken = '';
  const tokenLocators = [
    page.locator('code').filter({ hasText: 'sntrys_' }),
    page.locator('[data-test-id="token-value"]'),
    page.locator('input[value^="sntrys_"]'),
    page.locator('text=/sntrys_[A-Za-z0-9_]+/'),
  ];

  for (const locator of tokenLocators) {
    try {
      const first = locator.first();
      const text =
        (await first.textContent({ timeout: 5000 })) ?? (await first.inputValue({ timeout: 5000 }));
      const match = text?.match(/sntrys_[A-Za-z0-9_/+=.-]+/);
      if (match) {
        authToken = match[0];
        break;
      }
    } catch {}
  }

  if (!authToken) {
    console.warn('⚠️ Could not extract auth token automatically. Please check screenshot.');
    authToken = 'MANUAL_ENTRY_REQUIRED';
  } else {
    console.log('✅ Auth Token extracted');
  }

  await browser.close();

  const envPath = path.join(process.cwd(), '.env.local');
  const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
  const prefix = existing.length > 0 && !existing.endsWith('\n') ? '\n' : '';

  const sentryVars = [
    '# Sentry (added by automated setup)',
    `NEXT_PUBLIC_SENTRY_DSN=${dsn}`,
    `SENTRY_ORG=${orgSlug}`,
    'SENTRY_PROJECT=spec-web',
    `SENTRY_AUTH_TOKEN=${authToken}`,
    '',
  ].join('\n');

  fs.writeFileSync(envPath, `${existing}${prefix}${sentryVars}`, 'utf-8');

  const evidence = [
    'Variables written to .env.local:',
    '- NEXT_PUBLIC_SENTRY_DSN (set)',
    '- SENTRY_ORG (set)',
    '- SENTRY_PROJECT (set)',
    `- SENTRY_AUTH_TOKEN (${authToken === 'MANUAL_ENTRY_REQUIRED' ? 'NEEDS MANUAL ENTRY' : 'set'})`,
    '',
    'Existing variables preserved: YES',
  ].join('\n');

  fs.writeFileSync(path.join(evidenceDir, 'task-0-env-local.txt'), evidence, 'utf-8');

  console.log('\n✅ .env.local updated successfully!');
  console.log('Evidence written to .sisyphus/evidence/task-0-env-local.txt');
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('Setup failed:', message);
  process.exit(1);
});
