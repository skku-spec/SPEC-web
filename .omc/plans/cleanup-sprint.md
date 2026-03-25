# Cleanup Sprint Plan

> Generated: 2026-03-25 | Branch: `dev` (direct commit)
> Stack: Next.js 15, TypeScript, Supabase, Tailwind CSS

## Executive Summary

5 work items across 3 categories: **design-system fixes** (Task 1), **verification** (Tasks 2-3), **deletion + seeding** (Tasks 4-5). Total estimated effort: ~2.5 hours. Most tasks are parallelizable.

### Key Findings from Exploration

| Item | Status | Scope |
|------|--------|-------|
| Skeleton rounded values | 24+ violations across 2 files | Simple find-replace |
| Form builder | COMPLETE — 5 actions, CRUD UI, DB fallback | Verify only |
| FAQ | COMPLETE — 5 actions, CRUD UI, DB fallback | Verify only |
| Legacy deletion | 30 files + 7 reference files | Large but mechanical |
| Curriculum seed | 37 entries, table already exists | SQL generation |
| Footer.tsx | Already clean — no legacy refs found | Skip |

---

## Dependency Graph

```
                    ┌──────────┐
                    │  START   │
                    └────┬─────┘
                         │
           ┌─────────────┼─────────────────────┐
           │             │                      │
           v             v                      v
    ┌──────────┐  ┌────────────┐  ┌───────────────────┐
    │ Task 1   │  │ Task 2 + 3 │  │     Task 5        │
    │ Fix      │  │ Verify     │  │ Seed curriculum   │
    │ Rounded  │  │ Form + FAQ │  │                   │
    └────┬─────┘  └─────┬──────┘  └────────┬──────────┘
         │              │                   │
         │              │                   │
         v              v                   v
    ┌──────────────────────────────────────────────┐
    │              Task 4                          │
    │     Delete Legacy Code                       │
    │  (depends on nothing, but largest —          │
    │   run last to minimize rebase conflicts)     │
    └──────────────────┬───────────────────────────┘
                       │
                       v
               ┌──────────────┐
               │  npm run     │
               │  build       │
               └──────┬───────┘
                      │
                      v
               ┌──────────────┐
               │   DONE       │
               └──────────────┘
```

### Parallelization Plan (for ultrawork)

**Wave 1 (parallel — 3 agents):**
- Agent A: Task 1 — Fix skeleton rounded values + create audit loading.tsx
- Agent B: Task 2+3 — Verify form builder + FAQ (read-only verification, single agent)
- Agent C: Task 5 — Generate curriculum seed SQL

**Wave 2 (sequential — 1 agent):**
- Agent D: Task 4 — Delete legacy code (largest task, touches many files)

**Wave 3 (single):**
- Final build verification: `npm run build`

---

## Task 1: Fix Skeleton Rounded Values

**Category:** `quick` | **Skills:** `[]` | **Effort:** 15 min

### Problem

SPEC design system FORBIDS: `rounded-[32px]`, `rounded-[28px]`, `rounded-[24px]`, `rounded-[18px]`, `rounded-3xl`, `rounded-2xl`.
All must become `rounded-lg`.

### File Inventory

| File | Action | Violations |
|------|--------|------------|
| `components/ui/RouteLoading.tsx` | MODIFY | ~15 forbidden rounded values |
| `app/admin/homework/HomeworkClient.tsx` | MODIFY | ~9 forbidden rounded values |
| `app/admin/audit/loading.tsx` | CREATE | Missing loading page |

### Implementation Steps

#### 1a. Fix `components/ui/RouteLoading.tsx`

Replace ALL of these patterns with `rounded-lg`:
- `rounded-[32px]` → `rounded-lg`
- `rounded-[28px]` → `rounded-lg`
- `rounded-[24px]` → `rounded-lg`
- `rounded-[18px]` → `rounded-lg`
- `rounded-2xl` → `rounded-lg`

**Method:** Use `replaceAll` edit or ast-grep replace for each pattern.

#### 1b. Fix `app/admin/homework/HomeworkClient.tsx`

Replace ALL of these patterns with `rounded-lg`:
- `rounded-3xl` → `rounded-lg`
- `rounded-2xl` → `rounded-lg`

For buttons that have `rounded-2xl`, use `rounded-md` instead (per SPEC button spec).

**Heuristic:** If the element is a container/card → `rounded-lg`. If it's a button → `rounded-md`.

#### 1c. Create `app/admin/audit/loading.tsx`

```tsx
import { ListPageLoading } from "@/components/ui/RouteLoading";

export default function Loading() {
  return <ListPageLoading />;
}
```

Pattern matches existing admin loading pages (e.g., `app/admin/homework/loading.tsx`).

### Verification

- [ ] `npx tsc --noEmit` — zero errors on changed files
- [ ] `grep -r "rounded-\[32px\]\|rounded-\[28px\]\|rounded-\[24px\]\|rounded-\[18px\]\|rounded-3xl\|rounded-2xl" components/ui/RouteLoading.tsx` — zero results
- [ ] `grep -r "rounded-3xl\|rounded-2xl" app/admin/homework/HomeworkClient.tsx` — zero results
- [ ] `app/admin/audit/loading.tsx` exists and imports from RouteLoading

### Commit

```
fix(ui): replace forbidden rounded values with SPEC-approved radius

- RouteLoading.tsx: replace rounded-[32px/28px/24px/18px] and rounded-2xl with rounded-lg
- HomeworkClient.tsx: replace rounded-3xl/2xl with rounded-lg (containers) and rounded-md (buttons)
- Create app/admin/audit/loading.tsx (only admin page missing one)
```

---

## Task 2: Verify Form Builder Implementation

**Category:** verification (read-only) | **Skills:** `[]` | **Effort:** 10 min

### What to Verify

| Component | File | Expected State |
|-----------|------|---------------|
| Server actions (5) | `lib/actions/form-builder.ts` | `getFormFields`, `getAllFormFieldsBatches`, `upsertFormField`, `deleteFormField`, `duplicateFieldsForBatch` |
| Admin UI | `app/admin/form-builder/FormBuilderClient.tsx` | Full CRUD: create, read, update, delete fields. Batch selector. |
| Public page | `app/apply/form/page.tsx` | Calls `getFormFields()`, falls back to `FALLBACK_FORM_FIELDS` if empty |
| Seed data | `scripts/sql/029-application-form-fields.sql` | 6 fields for batch '4기' across 3 steps |
| Types | `npx tsc --noEmit` | Zero errors |

### Exploration Result

**Status: ALL COMPLETE.** No code changes needed.

- 5 actions exported, all with proper role checks and error handling
- Admin UI has full CRUD with batch management and toast notifications
- Public page reads DB-first with hardcoded fallback
- 4기 seed data: 6 fields (introduction, vision, startup_idea, friday_activity, team_collaboration, additional_comments)
- TypeScript compiles cleanly

### Verification

- [ ] `npx tsc --noEmit` passes
- [ ] All 5 actions exist and export correctly
- [ ] Admin page renders (check `app/admin/form-builder/page.tsx` imports)
- [ ] Public page has fallback logic

### Commit

No commit needed — verification only. Report findings.

---

## Task 3: Verify FAQ Implementation

**Category:** verification (read-only) | **Skills:** `[]` | **Effort:** 10 min

### What to Verify

| Component | File | Expected State |
|-----------|------|---------------|
| Server actions (5) | `lib/actions/faq.ts` | `getAllFaqItems`, `getFaqBySection`, `getFaqSections`, `upsertFaqItem`, `deleteFaqItem` |
| Admin UI | `app/admin/faq/FaqClient.tsx` | Full CRUD: section grouping, create/edit/delete modals |
| Public page | `app/demoday/faq/page.tsx` | Calls `getAllFaqItems()`, falls back to `FALLBACK_FAQ_SECTIONS` if empty |
| Types | `npx tsc --noEmit` | Zero errors |

### Exploration Result

**Status: ALL COMPLETE.** No code changes needed.

- 5 actions exported, all with role checks (preneur) and error handling
- Admin UI: 479 lines, full CRUD with section management and toast
- Public page: DB-first with 3-section × 15-item hardcoded fallback
- TypeScript compiles cleanly

### Verification

- [ ] `npx tsc --noEmit` passes
- [ ] All 5 actions exist and export correctly
- [ ] Admin page renders (check `app/admin/faq/page.tsx` imports)
- [ ] Public page has fallback logic

### Commit

No commit needed — verification only. Report findings.

---

## Task 4: Delete Legacy Code (Jobs + Launches + Library)

**Category:** `deep` | **Skills:** `["git-master"]` | **Effort:** 45 min

This is the largest task. Requires careful ordering to avoid broken imports during intermediate states.

### Phase 4a: Delete Files (30 files)

**Directories to `rm -rf`:**

| Directory | Files | Notes |
|-----------|-------|-------|
| `app/jobs/` | 8 | Includes nested `role/[role]/` and `location/[city]/` |
| `app/admin/jobs/` | 2 | page.tsx + JobsClient.tsx |
| `app/launches/` | 4 | page.tsx + layout.tsx + loading.tsx + LaunchesPageClient.tsx |
| `app/admin/launches/` | 2 | page.tsx + LaunchesClient.tsx |
| `app/library/` | 6 | Includes `search/` and `[slug]/` |
| `app/admin/library/` | 2 | page.tsx + LibraryClient.tsx |

**Action files to delete:**

| File | Notes |
|------|-------|
| `lib/actions/jobs.ts` | Server actions for jobs CRUD |
| `lib/actions/launches.ts` | Server actions for launches CRUD |
| `lib/actions/library.ts` | Server actions for library CRUD |

**Seed scripts to delete:**

| File | Notes |
|------|-------|
| `scripts/seed-jobs.ts` | Job seed data |
| `scripts/seed-launches.ts` | Launch seed data |
| `scripts/seed-library.ts` | Library seed data |

### Phase 4b: Remove References (7 files)

#### `app/admin/AdminSidebar.tsx`

**Remove from imports:** `Briefcase`, `Rocket`, `Library` (from lucide-react)
**Remove from nav items array:** Objects with hrefs `/admin/jobs`, `/admin/launches`, `/admin/library`

#### `app/admin/AdminNav.tsx`

**Same removals as AdminSidebar.tsx.**

#### `components/layout/Navbar.tsx`

**Remove:** "런칭 소식" button (~line 229 desktop, ~line 462 mobile)
**Remove:** Commented library link blocks (~lines 235-237, ~lines 467-469)

#### `components/layout/Footer.tsx`

**Status: ALREADY CLEAN.** No 채용/런칭 references found. Skip.

#### `middleware.ts`

**Remove from BLOCKED_ROUTES:** `"/jobs"` and `"/library"`

#### `e2e/public-pages.spec.ts`

**Remove:** Commented jobs test (~lines 27-32)
**Remove:** Launches test (~lines 34-37)

#### `e2e/route-access-coverage.spec.ts`

**Remove from blockedRoutes array:** `"/jobs"` and `"/library"`

### Phase 4c: Remove Type Definitions

#### `lib/supabase/types.ts`

**Remove 3 table type blocks:**
- `jobs` table definition (~lines 269-331)
- `library_items` table definition (~lines 332-388)
- `launches` table definition (~lines 584-625)

**CAUTION:** Line numbers may shift. Search for `jobs:`, `library_items:`, `launches:` as table keys in the `Tables` interface.

### Phase 4d: Create SQL Migration

**Create:** `scripts/sql/034-drop-legacy-tables.sql`

```sql
-- Drop legacy tables that are no longer used
-- Jobs, Launches, and Library features have been removed

DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.launches CASCADE;
DROP TABLE IF EXISTS public.library_items CASCADE;
```

### Verification

- [ ] `find app/jobs app/admin/jobs app/launches app/admin/launches app/library app/admin/library 2>/dev/null` — all directories gone
- [ ] `ls lib/actions/jobs.ts lib/actions/launches.ts lib/actions/library.ts 2>/dev/null` — all files gone
- [ ] `ls scripts/seed-jobs.ts scripts/seed-launches.ts scripts/seed-library.ts 2>/dev/null` — all files gone
- [ ] `grep -r "Briefcase\|Rocket\|Library" app/admin/AdminSidebar.tsx app/admin/AdminNav.tsx` — zero results (Library icon)
- [ ] `grep -r "런칭 소식" components/layout/Navbar.tsx` — zero results
- [ ] `grep -r '"/jobs"\|"/library"' middleware.ts` — zero results
- [ ] `grep -r "jobs\|library_items\|launches" lib/supabase/types.ts` — zero results for table keys
- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run build` — passes

### Commit

```
chore: delete legacy jobs, launches, and library modules

- Remove 30 files across app/, lib/actions/, scripts/
- Remove nav items from AdminSidebar, AdminNav, Navbar
- Remove blocked routes from middleware
- Remove test references from e2e specs
- Remove type definitions from supabase types
- Add 034-drop-legacy-tables.sql migration
```

---

## Task 5: Seed Learner Curriculum to DB

**Category:** `quick` | **Skills:** `[]` | **Effort:** 20 min

### Data Source

`app/curriculum/client-page.tsx` — `learnerWeeks` array (37 entries)

### Data Shape

```typescript
{
  week: number | 'OFF' | 'EVENT',
  topic: string,
  objectives: string,
  assignment: string,
  notes: string,
}
```

### Column Mapping

| Source Field | DB Column | Transform |
|-------------|-----------|-----------|
| (index + 1) | `sort_order` | Sequential 1-37 |
| `week` (if number) | `week_number` | Direct |
| `week` (if string) | `week_number` | `NULL` |
| `'Week N'` or `week` value | `week_label` | `'Week N'` for numbers, `'OFF'` or `'EVENT'` for strings |
| `topic` | `topic` | Direct |
| `objectives` | `objectives` | Direct |
| `assignment` | `assignment` | Direct |
| `notes` | `notes` | Direct |
| `'learner'` | `track` | Constant |
| `'default'` | `batch` | Constant |

### Target Table

`curriculum_weeks` — already created in `scripts/sql/030-curriculum-tables.sql`

Schema:
```
id uuid PK, track text, week_number int, week_label text,
topic text, objectives text, assignment text, notes text,
batch text, sort_order int, created_at timestamptz, updated_at timestamptz
```

### File to Create

`scripts/sql/035-seed-learner-curriculum.sql`

**Structure:**
```sql
-- Seed 37 learner curriculum entries from hardcoded data
-- Source: app/curriculum/client-page.tsx learnerWeeks array

INSERT INTO public.curriculum_weeks
  (track, week_number, week_label, topic, objectives, assignment, notes, batch, sort_order)
VALUES
  ('learner', 1, 'Week 1', 'Kickoff', '...', '0원', '프로그램 시작', 'default', 1),
  -- ... all 37 entries
  ('learner', 30, 'Week 30', 'Demo Day', '...', '...', '...', 'default', 37)
ON CONFLICT DO NOTHING;
```

**Important:**
- Use `E'...'` syntax for strings containing `\n` (newlines) or escape with `$$`
- For `'OFF'` entries: `week_number = NULL`, `week_label = 'OFF'`
- For `'EVENT'` entries: `week_number = NULL`, `week_label = 'EVENT'`
- Use `ON CONFLICT DO NOTHING` to make idempotent

### Verification

- [ ] SQL file has exactly 37 INSERT values
- [ ] All `'OFF'` entries have `week_number = NULL`
- [ ] All `'EVENT'` entries have `week_number = NULL`
- [ ] `week_label` is `'Week N'` for numbered weeks
- [ ] `sort_order` is sequential 1-37
- [ ] SQL syntax is valid (no unescaped quotes)

### Commit

```
feat(db): add learner curriculum seed data (37 weeks)

- Create 035-seed-learner-curriculum.sql
- Maps all 37 entries from hardcoded learnerWeeks array
- Includes OFF weeks and EVENT entries with NULL week_number
```

---

## Atomic Commit Strategy

| Order | Commit | Files Changed | Can Revert Independently |
|-------|--------|---------------|-------------------------|
| 1 | `fix(ui): replace forbidden rounded values` | 3 files (modify 2, create 1) | YES |
| 2 | `chore: delete legacy jobs, launches, library` | 30 deleted + 7 modified + 1 created | YES (git revert) |
| 3 | `feat(db): add learner curriculum seed data` | 1 created | YES |

Tasks 2 and 3 produce no commits (verification only).

**Commit order rationale:**
1. Rounded fix first — smallest, no dependencies, immediately verifiable
2. Legacy deletion second — large but mechanical, clean separation
3. Curriculum seed last — additive only, no risk to existing code

---

## Ultrawork Execution Config

```yaml
mode: ultrawork
waves:
  - name: "Wave 1: Parallel fixes + verification + seed"
    agents:
      - id: agent-a
        task: "Task 1 — Fix rounded values + create audit loading"
        category: quick
        skills: []
        files:
          modify:
            - components/ui/RouteLoading.tsx
            - app/admin/homework/HomeworkClient.tsx
          create:
            - app/admin/audit/loading.tsx

      - id: agent-b
        task: "Task 2+3 — Verify form builder + FAQ"
        category: quick
        skills: []
        files:
          read_only:
            - lib/actions/form-builder.ts
            - app/admin/form-builder/FormBuilderClient.tsx
            - app/apply/form/page.tsx
            - scripts/sql/029-application-form-fields.sql
            - lib/actions/faq.ts
            - app/admin/faq/FaqClient.tsx
            - app/demoday/faq/page.tsx

      - id: agent-c
        task: "Task 5 — Generate curriculum seed SQL"
        category: quick
        skills: []
        files:
          read:
            - app/curriculum/client-page.tsx
            - scripts/sql/030-curriculum-tables.sql
          create:
            - scripts/sql/035-seed-learner-curriculum.sql

  - name: "Wave 2: Legacy deletion"
    depends_on: ["Wave 1"]
    agents:
      - id: agent-d
        task: "Task 4 — Delete legacy code"
        category: deep
        skills: ["git-master"]
        files:
          delete: 30 files (see Task 4 inventory)
          modify:
            - app/admin/AdminSidebar.tsx
            - app/admin/AdminNav.tsx
            - components/layout/Navbar.tsx
            - middleware.ts
            - e2e/public-pages.spec.ts
            - e2e/route-access-coverage.spec.ts
            - lib/supabase/types.ts
          create:
            - scripts/sql/034-drop-legacy-tables.sql

  - name: "Wave 3: Final verification"
    depends_on: ["Wave 2"]
    commands:
      - npx tsc --noEmit
      - npm run build
```

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Legacy type deletion breaks imports elsewhere | Build failure | Run `grep -r` for jobs/launches/library imports before deleting types |
| Curriculum SQL has unescaped Korean quotes | Migration failure | Use dollar-quoted strings `$$...$$` for values with apostrophes |
| Navbar removal breaks layout | Visual regression | Verify desktop + mobile menu after removal |
| `rounded-lg` doesn't match skeleton visual intent | Minor visual change | Acceptable — SPEC design system mandates it |
| Footer.tsx already clean (user expected refs there) | None | Confirmed clean via grep — skip Footer edits |

---

## Deviations from Original Requirements

1. **Footer.tsx**: User asked to remove "채용 정보" and "런칭 소식" from Footer. **Grep found zero matches** — Footer is already clean. Skipping.
2. **Learner weeks count**: 37 entries total (30 numbered weeks + 4 OFF + 3 EVENT). User said 37 — confirmed correct.
3. **SQL file numbering**: User specified `034` for drop tables and `035` for curriculum seed. Latest existing migration is `033-audit-logs.sql`. Numbering matches.
