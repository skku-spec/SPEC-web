# Supabase Project Files

Supabase CLI config and timestamped production schema migrations.

## STRUCTURE
| Path | Purpose |
|------|---------|
| `config.toml` | Local Supabase CLI ports, auth, storage, migrations config |
| `migrations/*.sql` | Canonical ordered database migrations |

## WHERE TO LOOK
| Task | Location |
|------|----------|
| App DB clients/types | `lib/supabase/AGENTS.md` |
| Generated/manual TS table types | `lib/supabase/types.ts` |
| Historical SQL reference | `scripts/sql/AGENTS.md` |
| Schema docs | `docs/DATABASE_ERD.md`, `docs/ERD_MIGRATION_PLAN.md` |
| Apply remote migrations | `npx supabase db push` |

## MIGRATION RULES
- New migrations use `YYYYMMDDHHMMSS_descriptive_name.sql`.
- Prefer additive, idempotent SQL where possible: `IF EXISTS`, `IF NOT EXISTS`, safe `DROP POLICY IF EXISTS`.
- Update `lib/supabase/types.ts` after schema changes; it is manually maintained here.
- RLS changes must be mirrored by server-action auth checks and tests when user-visible.
- Keep role values aligned with `outsider`, `learner`, `alumni`, `preneur` plus `is_admin`.
- `applications` remains special: public INSERT, restricted SELECT paths, admin/service reads where needed.

## ANTI-PATTERNS
- Do not edit old migrations to change production history; add a new migration.
- Do not put one-off dashboard SQL here unless it is intended to be replayed.
- Do not use legacy `admin` role assumptions; check `is_admin` or `preneur` explicitly.
- Do not commit Supabase secrets or signing keys referenced by `config.toml`.
