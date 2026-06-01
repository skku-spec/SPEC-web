# Vitest Tests

Unit and component tests for utilities, middleware, server actions, and UI components.

## STRUCTURE
| Path | Purpose |
|------|---------|
| `setup.ts` | Jest DOM setup for Vitest |
| `mocks/server-only.ts` | Alias target for `server-only` imports |
| `lib/` | Utility/action/auth tests |
| `components/` | React Testing Library component tests |
| `middleware.test.ts` | Middleware helper coverage |

## COMMANDS
```bash
npm run test:unit
npx vitest run __tests__/path/to/file.test.ts
```

## CONVENTIONS
- Tests run in `jsdom` via `vitest.config.ts`.
- Use `@` imports; Vitest maps `@` to repo root.
- Mock `server-only` through the configured alias or virtual mock when importing server actions.
- Prefer explicit Supabase chain mocks for server action tests.
- Keep Korean validation/error strings exact; callers assert user-facing text.
- Put Playwright coverage in `e2e/`, not here.

## ANTI-PATTERNS
- Do not weaken assertions just to satisfy brittle UI text.
- Do not import real Supabase clients in unit tests.
- Do not use `as any`; existing tests use narrower casts such as `as never` for mocked clients.
