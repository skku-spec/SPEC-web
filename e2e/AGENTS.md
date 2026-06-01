# Playwright E2E Tests

Browser-level checks for public pages, auth redirects, application flow, and route access.

## STRUCTURE
| File | Purpose |
|------|---------|
| `public-pages.spec.ts` | Public route smoke coverage |
| `protected-routes.spec.ts` | Middleware redirect behavior |
| `auth-flows.spec.ts` | Login/signup/reset flows |
| `application-form.spec.ts` | Apply route auth requirements |
| `application-status.spec.ts` | Application status surface |
| `route-access-coverage.spec.ts` | Broader route access matrix |

## COMMANDS
```bash
npm run test
npx playwright test e2e/protected-routes.spec.ts
```

## CONVENTIONS
- `playwright.config.ts` starts `npm run dev` at `http://localhost:3000`.
- Chromium is the only configured project.
- Use role/name locators where visible copy is stable.
- Tests should verify observable redirects or page state, not implementation details.
- Unauthenticated coverage is cheap; authenticated flows need fixtures or explicit setup before expansion.

## ANTI-PATTERNS
- Do not hard-code a different base URL; use the Playwright config.
- Do not add tests that depend on external production Supabase data.
- Do not disable retries/timeouts locally to hide flake; fix the wait or selector.
