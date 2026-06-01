# SQL Scripts

Historical/manual SQL snapshots and migration runners. Canonical replayable migrations live in `supabase/migrations/`.

## STRUCTURE
| Pattern | Meaning |
|---------|---------|
| `001-init.sql` | Early full schema snapshot |
| `0xx-*.sql` | Manual or historical migration steps |
| `017-*`, `018-*`, `019-*` duplicates | Parallel historical branches; inspect before assuming order |

## WHERE TO LOOK
| Task | Location |
|------|----------|
| Current migrations | `supabase/migrations/` |
| Runtime TS types | `lib/supabase/types.ts` |
| Server action behavior | `lib/actions/` |
| ERD notes | `docs/DATABASE_ERD.md`, `docs/ERD_MIGRATION_PLAN.md` |

## CONVENTIONS
- Treat these files as reference material unless the user explicitly asks to update legacy scripts.
- When creating production schema changes, add a timestamped file under `supabase/migrations/` instead.
- Many older scripts use obsolete role names such as `runner` or `admin`; translate to current role model before reusing.
- Compare scripts against later migrations before copying policies or functions.

## ANTI-PATTERNS
- Do not apply `scripts/sql` files blindly to a live database.
- Do not copy `WITH CHECK(true)` or outdated role policies into new migrations.
- Do not renumber existing scripts to make the sequence look clean.
