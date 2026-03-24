# Recruitment Management System — Implementation Plan (v2)

> **Goal:** Build a status-driven, "no-code" recruitment management system where an admin sets ONE status and everything site-wide auto-cascades — banner, landing page card, apply page (open vs closed), and badges. Operators run entire cohort cycles without developer intervention.

**Created:** 2026-03-24  
**Revised:** 2026-03-24 (v2 — user feedback incorporated)  
**Status:** Draft — awaiting user confirmation  
**Branch:** `feature/recruitment-management`  
**Base:** `dev`

---

## Context

### Current State (Problems)

1. **All recruitment config is hardcoded** in `lib/recruitment-schedule.ts` — batch number ("4"), labels, timeline dates, and banner flag are frozen TypeScript constants. Every new cohort requires a code deploy.
2. **The `/apply` page has no "closed" state** — always shows the apply form regardless of whether recruitment is active.
3. **Applications admin has no batch filtering** — shows all applications in a flat list.
4. **Banner is dead code** — the active `components/Navbar.tsx` (used in `app/layout.tsx` line 3) has the banner comment-removed (line 88: `{/* Recruitment banner removed */}`). The OTHER file `components/layout/Navbar.tsx` has a commented-out banner but is NOT imported anywhere in the app.
5. **No recruitment_settings table exists** — no DB concept of recruitment state.
6. **No way for visitors to express interest** when recruitment is closed.

### Target State

- A **status-driven system**: admin selects a status (e.g., "모집 중") → banner, landing card, apply page, badges ALL auto-update.
- A `recruitment_settings` table with a `status` field controlling site-wide behavior.
- A `recruitment_waitlist` table where visitors leave phone numbers when recruitment is closed.
- Admin "모집 설정" page to manage everything + view waitlist.
- The `/apply` page dynamically shows open mode OR a polished closed page with waitlist phone input.
- Applications admin gains batch filtering.

---

## Status-Driven Cascade System

### The `status` Field

| Status Value | Korean Label | Navbar Banner | Homepage Card | `/apply` Page | Form Access |
|---|---|---|---|---|---|
| `recruiting` | 모집 중 | **SHOW** — orange bar with batch label + D-day | **SHOW** — recruitment CTA card | Open — full apply flow | Allowed |
| `reviewing` | 심사 중 | **SHOW** — muted bar "심사가 진행 중입니다" | **SHOW** — status update card | Closed — "심사 진행 중" messaging | Blocked |
| `closed` | 모집 마감 | **HIDE** | **HIDE** | Closed — inspirational copy + waitlist phone input | Blocked |
| `upcoming` | 모집 예정 | **SHOW** — "다음 모집이 준비 중입니다" | **SHOW** — teaser card | Closed — teaser + waitlist phone input | Blocked |

### Cascade Rules (ONE status → everything updates)

```
Admin sets status = "recruiting"
  → Navbar banner: visible, orange bg-[#FF6C0F], "{bannerLabel} — 지원 마감 D-{n}"
  → Homepage: recruitment card visible between Manifesto and AlumniGrid
  → /apply: full apply flow (current behavior)
  → /apply/form: accessible
  → submitApplication(): allowed

Admin sets status = "closed"
  → Navbar banner: hidden
  → Homepage: recruitment card hidden
  → /apply: inspirational closed page + phone waitlist input
  → /apply/form: redirects to /apply
  → submitApplication(): rejected with "현재 모집 기간이 아닙니다."
```

---

## Database Schema Design

### Table 1: `recruitment_settings`

```sql
-- Migration: 025-recruitment-settings.sql

CREATE TABLE public.recruitment_settings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Cohort identity
  batch           text NOT NULL UNIQUE,                     -- e.g., "4", "5"
  batch_label     text NOT NULL,                            -- e.g., "SPEC 5기 러너"
  short_label     text NOT NULL,                            -- e.g., "SPEC 5기 모집"
  banner_label    text NOT NULL DEFAULT '',                 -- e.g., "SPEC 5기 러너 모집 중"
  hero_badge      text NOT NULL DEFAULT '',                 -- e.g., "2026 Fall · 5기"

  -- Status-driven control (THE key field)
  status          text NOT NULL DEFAULT 'closed'
                    CHECK (status IN ('recruiting', 'reviewing', 'closed', 'upcoming')),

  -- Banner display (auto-derived from status, but allows override)
  show_banner     boolean NOT NULL DEFAULT false,

  -- Timeline steps (JSONB array)
  -- Each element: { title, date, highlight, start: {year,month,day}, end?: {year,month,day} }
  timeline_steps  jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Metadata
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at (idempotent)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_recruitment_settings_updated_at
  BEFORE UPDATE ON public.recruitment_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Index: quick lookup of active (non-closed) recruitment
CREATE INDEX idx_recruitment_settings_status
  ON public.recruitment_settings (status) WHERE status != 'closed';

-- RLS
ALTER TABLE public.recruitment_settings ENABLE ROW LEVEL SECURITY;

-- Public read (needed for /apply, navbar banner, homepage card)
CREATE POLICY "Anyone can read recruitment settings"
  ON public.recruitment_settings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin/preneur write
CREATE POLICY "Admins can manage recruitment settings"
  ON public.recruitment_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'preneur')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'preneur')
    )
  );

-- Seed: 4기 (closed)
INSERT INTO public.recruitment_settings (
  batch, batch_label, short_label, banner_label, hero_badge,
  status, show_banner, timeline_steps
) VALUES (
  '4',
  'SPEC 4기 러너 (추가 모집)',
  'SPEC 4기 추가 모집',
  'SPEC 4기 러너 추가 모집 중',
  '2026 Spring · 4기 추가 모집',
  'closed',
  false,
  '[
    {"title":"1차 서류 접수","date":"3/13(금) ~ 3/16(월)","highlight":false,"start":{"year":2026,"month":3,"day":13},"end":{"year":2026,"month":3,"day":16}},
    {"title":"서류 결과 발표","date":"3/17(화)","highlight":false,"start":{"year":2026,"month":3,"day":17}},
    {"title":"2차 온라인 면접","date":"3/18(수) ~ 3/22(일)","highlight":false,"start":{"year":2026,"month":3,"day":18},"end":{"year":2026,"month":3,"day":22}},
    {"title":"최종 결과 발표","date":"3/23(월)","highlight":false,"start":{"year":2026,"month":3,"day":23}},
    {"title":"OT (필참)","date":"3/27(금)","highlight":true,"start":{"year":2026,"month":3,"day":27}}
  ]'::jsonb
);
```

### Why JSONB for timeline_steps?

- Timeline steps vary per cohort (some may have extra rounds, different names).
- Avoids a separate join table.
- Validated at the application layer (Zod schema).
- Operators edit through a structured UI, not raw JSON.

### Table 2: `recruitment_waitlist`

```sql
-- Migration: 026-recruitment-waitlist.sql

CREATE TABLE public.recruitment_waitlist (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       text NOT NULL,
  name        text,                              -- Optional
  email       text,                              -- Optional
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Prevent duplicate phone signups
CREATE UNIQUE INDEX idx_waitlist_phone ON public.recruitment_waitlist (phone);

-- RLS
ALTER TABLE public.recruitment_waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can submit their phone (anon + authenticated)
CREATE POLICY "Anyone can join waitlist"
  ON public.recruitment_waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can view (PII protection)
CREATE POLICY "Admins can view waitlist"
  ON public.recruitment_waitlist FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'preneur')
    )
  );

-- Only admins can delete
CREATE POLICY "Admins can delete from waitlist"
  ON public.recruitment_waitlist FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'preneur')
    )
  );
```

---

## Complete File Inventory

### New Files (13)
| # | Path | Purpose |
|---|------|---------|
| 1 | `scripts/sql/025-recruitment-settings.sql` | recruitment_settings table + RLS + seed |
| 2 | `scripts/sql/026-recruitment-waitlist.sql` | recruitment_waitlist table + RLS |
| 3 | `supabase/migrations/20260324_recruitment_settings.sql` | Deployable migration (copy of 025) |
| 4 | `supabase/migrations/20260324_recruitment_waitlist.sql` | Deployable migration (copy of 026) |
| 5 | `lib/types/recruitment.ts` | Zod schemas + TypeScript types |
| 6 | `lib/actions/recruitment.ts` | Server actions for recruitment + waitlist |
| 7 | `app/apply/RecruitmentClosedView.tsx` | Closed page component with waitlist phone form |
| 8 | `app/admin/recruitment/page.tsx` | Admin recruitment settings page (server) |
| 9 | `app/admin/recruitment/RecruitmentSettingsClient.tsx` | Admin settings form (client) |
| 10 | `app/admin/recruitment/loading.tsx` | Loading skeleton |
| 11 | `components/RecruitmentCard.tsx` | Homepage data-driven recruitment card (server) |
| 12 | `components/RecruitmentBanner.tsx` | Navbar banner (server component, sits above Navbar) |
| 13 | `__tests__/lib/recruitment.test.ts` | Unit tests |

### Modified Files (10)
| # | Path | Changes |
|---|------|---------|
| 1 | `lib/supabase/types.ts` | Add recruitment_settings + recruitment_waitlist table types |
| 2 | `lib/recruitment-schedule.ts` | Refactor: add DB-aware async functions, keep sync fallbacks |
| 3 | `app/layout.tsx` | Insert `<RecruitmentBanner />` above `<Navbar />` |
| 4 | `app/page.tsx` | Add `<RecruitmentCard />` between Manifesto and AlumniGrid |
| 5 | `app/apply/page.tsx` | Conditional open/closed rendering based on DB status |
| 6 | `app/apply/form/page.tsx` | Add server guard: redirect when status != "recruiting" |
| 7 | `app/apply/edit/page.tsx` | Add server guard: redirect when status != "recruiting" |
| 8 | `lib/actions/applications.ts` | Server-side submission rejection when recruitment closed |
| 9 | `app/admin/applications/ApplicationsClient.tsx` | Add batch filter dropdown |
| 10 | `app/admin/AdminSidebar.tsx` | Add "모집 설정" nav item |

### E2E Test Files (3)
| # | Path | Purpose |
|---|------|---------|
| 1 | `e2e/recruitment-closed.spec.ts` | /apply closed view + waitlist phone submission |
| 2 | `e2e/admin-recruitment.spec.ts` | Admin status toggle + settings save + waitlist view |
| 3 | `e2e/apply-form-guard.spec.ts` | Form redirect when closed |

---

## Task Flow — Parallel Execution Graph

### Wave 0: Foundation (Database + Types) — 3 parallel workers

| Task | Cat | Files | Description |
|------|-----|-------|-------------|
| **T0.1** | quick | `scripts/sql/025-*.sql`, `supabase/migrations/20260324_recruitment_settings.sql` | Create recruitment_settings migration with status CHECK constraint, RLS, trigger, index, 4기 seed |
| **T0.2** | quick | `scripts/sql/026-*.sql`, `supabase/migrations/20260324_recruitment_waitlist.sql` | Create recruitment_waitlist migration with unique phone index, RLS |
| **T0.3** | quick | `lib/supabase/types.ts`, `lib/types/recruitment.ts` | Add DB types for both tables; Zod schemas for `TimelineStep`, `RecruitmentSettings`, `WaitlistEntry`, `RecruitmentStatus`; derived TS types |

**Acceptance Criteria (Wave 0):**
- [ ] Both migrations run clean on fresh Supabase
- [ ] Anon can SELECT recruitment_settings but not INSERT/UPDATE/DELETE
- [ ] Preneur+ can full CRUD on recruitment_settings
- [ ] Anon can INSERT into waitlist but not SELECT
- [ ] Duplicate phone INSERT returns unique constraint error
- [ ] `tsc --noEmit` passes with new types
- [ ] Zod schemas correctly validate/reject timeline step data

**Commits:**
1. `feat(db): add recruitment_settings table with status-driven control`
2. `feat(db): add recruitment_waitlist table for phone collection`
3. `feat(types): add Zod schemas and DB types for recruitment system`

---

### Wave 1: Data Access Layer — 3 parallel workers

| Task | Cat | Files | Description |
|------|-----|-------|-------------|
| **T1.1** | deep | `lib/actions/recruitment.ts` (NEW) | All 8 server actions (see spec below) |
| **T1.2** | quick | `lib/recruitment-schedule.ts` | Refactor: add `getRecruitmentConfig()` async, `isRecruitmentOpen()`, keep all existing sync exports as fallbacks |
| **T1.3** | quick | `__tests__/lib/recruitment.test.ts` (NEW) | Unit tests: Zod validation, timeline calc, D-day, status cascade rules |

**Server Actions Specification (T1.1):**

```typescript
// === PUBLIC (no auth required) ===

getActiveRecruitment()
  // Returns the non-"closed" row (or null).
  // If multiple non-closed exist, prefer status="recruiting", else first found.
  // Used by: Navbar banner, homepage card, /apply page.

getRecruitmentByBatch(batch: string)
  // Returns specific batch settings. Public read.

// === PUBLIC (rate-limited) ===

submitWaitlistPhone(phone: string, name?: string, email?: string)
  // Validate phone format: reuse PHONE_REGEX from applications.ts.
  // Normalize: strip hyphens before storing.
  // Insert into recruitment_waitlist.
  // Rate limit: 3 per 15min per IP.
  // Duplicate phone (unique constraint 23505): return { success: true, duplicate: true }
  //   with message "이미 등록된 번호입니다" (treat as success, not error).

// === ADMIN ONLY (preneur+) ===

getAllRecruitments()
  // Returns all rows ordered by created_at desc. Admin auth required.

upsertRecruitmentSettings(data: RecruitmentSettingsInput)
  // Create or update (upsert on batch).
  // Validates with Zod schema.
  // CASCADE RULE: If status is being set to "recruiting", auto-close ALL other rows.
  // Auto-set show_banner:
  //   "recruiting" | "reviewing" | "upcoming" → true
  //   "closed" → false
  // Revalidates: /apply, /admin/recruitment, / (homepage).

updateRecruitmentStatus(batch: string, status: RecruitmentStatus)
  // Quick status change. Same cascade + auto-banner rules as above.
  // Revalidates same paths.

getWaitlistEntries()
  // Returns all waitlist entries ordered by created_at desc. Admin only.

deleteWaitlistEntry(id: string)
  // Delete single entry. Admin only. Revalidates /admin/recruitment.
```

**Acceptance Criteria (Wave 1):**
- [ ] `getActiveRecruitment()` returns null when all are "closed"
- [ ] `updateRecruitmentStatus("5", "recruiting")` sets batch 5 to recruiting AND sets all others to "closed"
- [ ] `upsertRecruitmentSettings` rejects invalid timeline JSON via Zod
- [ ] Non-admin users get "Insufficient permissions" on mutation actions
- [ ] `submitWaitlistPhone("010-1234-5678")` inserts; second call returns `{ success: true, duplicate: true }`
- [ ] Rate limiting blocks after 3 submissions from same IP
- [ ] All existing imports from `recruitment-schedule.ts` continue working unchanged
- [ ] `getRecruitmentConfig()` returns DB data when available, hardcoded fallback otherwise
- [ ] All unit tests pass with `vitest run`

**Commits:**
4. `feat(actions): add recruitment and waitlist server actions`
5. `refactor(recruitment-schedule): make DB-aware with sync fallback`
6. `test(recruitment): add unit tests for validation, timeline, and status`

---

### Wave 2: UI Components — 3 parallel workers

| Task | Cat | Skills | Files | Description |
|------|-----|--------|-------|-------------|
| **T2.1** | visual-engineering | `frontend-ui-ux` | `app/apply/RecruitmentClosedView.tsx` | Closed page: inspirational copy + phone waitlist form (see detailed spec below) |
| **T2.2** | visual-engineering | `frontend-ui-ux` | `app/admin/recruitment/RecruitmentSettingsClient.tsx` | Admin form: status selector, labels, timeline editor, cohort history, waitlist viewer (see detailed spec below) |
| **T2.3** | visual-engineering | `frontend-ui-ux` | `components/RecruitmentCard.tsx`, `components/RecruitmentBanner.tsx` | Homepage card (server component) + Navbar banner (server component) — both data-driven (see detailed spec below) |

**Acceptance Criteria (Wave 2):**
- [ ] T2.1: Renders Korean inspirational copy; phone input with XXX-XXXX-XXXX formatting; submit calls server action; shows success/duplicate feedback; NO past timeline; responsive; SPEC design system
- [ ] T2.2: Status dropdown with 4 options; cascade warning when selecting "recruiting"; text inputs for all labels; timeline step editor (add/remove/edit); cohort history table; waitlist table with delete; SPEC design system
- [ ] T2.3: RecruitmentCard renders correct content per status; returns null when "closed"; all text from DB (no hardcoded copy); SPEC design system. RecruitmentBanner renders orange bar when show_banner=true; shows D-day for "recruiting"; returns null when hidden.

**Commits:**
7. `feat(apply): add recruitment closed view with waitlist phone input`
8. `feat(admin): add recruitment settings form with status control and waitlist viewer`
9. `feat(site): add data-driven recruitment banner and homepage card components`

---

### Wave 3: Page Integration — 2 workers, 4 tasks

**Worker A (apply flow):**

| Task | Cat | Files | Description |
|------|-----|-------|-------------|
| **T3.1** | deep | `app/apply/page.tsx` | Fetch active recruitment. If status != "recruiting" → render `RecruitmentClosedView` with status prop. Else → current content with DB-sourced labels. |
| **T3.2** | quick | `app/apply/form/page.tsx`, `app/apply/edit/page.tsx` | Add guard: fetch recruitment, if not "recruiting" → `redirect("/apply")`. |

**Worker B (admin + homepage + banner):**

| Task | Cat | Files | Description |
|------|-----|-------|-------------|
| **T3.3** | deep | `app/admin/recruitment/page.tsx`, `loading.tsx`, `app/admin/AdminSidebar.tsx` | Server component fetches all recruitments + waitlist → passes to client. Nav item: "모집 설정" with Settings icon between "지원서" and "게시물". |
| **T3.4** | deep | `app/layout.tsx`, `app/page.tsx` | Layout: insert `<RecruitmentBanner />` above `<Navbar />`. Homepage: add `<RecruitmentCard />` between Manifesto and AlumniGrid sections. |

**Acceptance Criteria (Wave 3):**
- [ ] T3.1: `/apply` shows closed view when status != "recruiting"; shows current content when "recruiting"; uses DB labels
- [ ] T3.2: Direct URL `/apply/form` redirects to `/apply` when closed; server-side (no flash)
- [ ] T3.3: `/admin/recruitment` loads; nav item visible; active state works; loading skeleton shows
- [ ] T3.4: Banner appears above Navbar when status has show_banner=true; homepage card appears between Manifesto and AlumniGrid; both hidden when "closed"

**Commits:**
10. `feat(apply): conditionally show closed/open state from DB status`
11. `feat(apply): guard form and edit routes against closed recruitment`
12. `feat(admin): add recruitment settings page with nav item`
13. `feat(site): wire recruitment banner and homepage card into layout`

---

### Wave 4: Submission Guard + Batch Filter — 2 parallel workers

| Task | Cat | Files | Description |
|------|-----|-------|-------------|
| **T4.1** | quick | `lib/actions/applications.ts` | In `submitApplication()` and `updateMyApplication()`: check active recruitment; if no "recruiting" status for submitted batch → return `{ error: "현재 모집 기간이 아닙니다." }` |
| **T4.2** | deep | `app/admin/applications/ApplicationsClient.tsx` | Add batch filter: extract unique batches, show dropdown (reuse `CustomSelect`), client-side filter, show count, default to latest batch. |

**Acceptance Criteria (Wave 4):**
- [ ] T4.1: Server rejects submissions when closed; error message is Korean; existing applications still viewable
- [ ] T4.2: Batch dropdown with "전체" + all batches (desc sorted); instant client-side filtering; count updates; default = latest; mobile works

**Commits:**
14. `feat(applications): server-side submission guard against closed recruitment`
15. `feat(admin): add batch filtering to applications page`

---

### Wave 5: E2E Tests — 3 parallel workers

| Task | Cat | Files | Description |
|------|-----|-------|-------------|
| **T5.1** | deep | `e2e/recruitment-closed.spec.ts` | Verify: /apply shows closed view; phone input formats; waitlist submission succeeds |
| **T5.2** | deep | `e2e/admin-recruitment.spec.ts` | Verify: admin can toggle status; settings save; waitlist entries visible |
| **T5.3** | quick | `e2e/apply-form-guard.spec.ts` | Verify: /apply/form redirects when closed |

**Commit:**
16. `test(e2e): add recruitment management end-to-end tests`

---

## Detailed Component Specifications

### T2.1 — RecruitmentClosedView ("모집 마감" Page)

**File:** `app/apply/RecruitmentClosedView.tsx` (client component — needs `useTransition` for form)

**Props:**
```typescript
type RecruitmentClosedViewProps = {
  status: 'closed' | 'reviewing' | 'upcoming';
  batchLabel?: string;  // e.g., "SPEC 4기 추가 모집" (for context only)
};
```

**Layout:**
```
┌──────────────────────────────────────────────┐
│  min-h-screen bg-[#f5f5ee]                    │
│                                                │
│  [max-w-760px centered, pt-20 pb-16]           │
│                                                │
│  H1: "Apply to SPEC"                          │
│  (system-ui font-black, same as current)       │
│                                                │
│  Status badge: (varies by status)              │
│  - closed:    "모집 마감"     bg-[#16140f]     │
│  - reviewing: "심사 진행 중"  bg-[#2563EB]     │
│  - upcoming:  "모집 준비 중"  bg-[#FF6C0F]     │
│  (rounded-full text-white px-4 py-1.5          │
│   font-['Pretendard',sans-serif] text-sm       │
│   font-semibold mt-6)                          │
│                                                │
│  ── Inspirational copy ──                      │
│  (mt-8 space-y-5 font-['Pretendard',sans-serif]│
│   text-[17px] leading-[1.75] text-[#4a4a40])  │
│                                                │
│  STATUS=closed:                                │
│    P1: "지금은 모집 기간이 아닙니다."            │
│    P2: "하지만 창업의 시작은 지원서가 아닙니다.   │
│         문제를 발견하는 눈, 직접 해보겠다는       │
│         결심 — 그것이 진짜 시작입니다."          │
│    P3: "다음 기수에서 다시 만나길 바랍니다.       │
│         그 전까지, 당신의 창업의 꿈을             │
│         잘 지켜나가고 있길."                     │
│                                                │
│  STATUS=reviewing:                             │
│    P1: "현재 심사가 진행 중입니다."              │
│    P2: "결과는 지원서에 기재한 연락처로            │
│         안내됩니다. 조금만 기다려주세요."          │
│                                                │
│  STATUS=upcoming:                              │
│    P1: "다음 기수 모집을 준비하고 있습니다."       │
│    P2: "곧 만날 수 있습니다."                    │
│                                                │
│  ── Waitlist Card ──                           │
│  (mt-12 rounded-lg border border-[#ddd9cc]     │
│   bg-white p-8 md:p-10)                        │
│                                                │
│  ┌────────────────────────────────────────┐    │
│  │ CalendarClock icon (h-5 w-5            │    │
│  │   text-[#6b6b5e] mb-3)                 │    │
│  │                                         │    │
│  │ H3: "다음 모집 안내 받기"                │    │
│  │ (font-['Pretendard',sans-serif]         │    │
│  │  text-lg font-bold text-[#16140f])      │    │
│  │                                         │    │
│  │ P: "전화번호를 남겨주시면 다음 모집 시     │    │
│  │    안내 연락을 드리겠습니다."             │    │
│  │ (text-sm text-[#4a4a40] mt-2)           │    │
│  │                                         │    │
│  │ [Phone input]                           │    │
│  │  rounded-lg border border-[#ddd9cc]     │    │
│  │  bg-white py-2.5 px-4 h-12 mt-4        │    │
│  │  font-['Pretendard',sans-serif]         │    │
│  │  text-sm text-[#16140f]                 │    │
│  │  placeholder: "010-0000-0000"           │    │
│  │  placeholder:text-[#16140f]/40          │    │
│  │  focus:border-[#FF6C0F]/50             │    │
│  │  focus:ring-2 focus:ring-[#FF6C0F]/10  │    │
│  │  Auto-format: XXX-XXXX-XXXX            │    │
│  │                                         │    │
│  │ [등록하기] (mt-3 w-full h-10            │    │
│  │  rounded-md bg-[#16140f] text-white     │    │
│  │  font-['Pretendard',sans-serif]         │    │
│  │  text-sm font-semibold)                 │    │
│  │                                         │    │
│  │ Success state (replaces button):        │    │
│  │  CheckCircle icon + "등록되었습니다.      │    │
│  │  다음 모집 시 연락 드리겠습니다."         │    │
│  │  (text-[#2f9e44] text-sm)               │    │
│  │                                         │    │
│  │ Duplicate state:                        │    │
│  │  "이미 등록된 번호입니다."               │    │
│  │  (text-[#6b6b5e] text-sm)               │    │
│  └────────────────────────────────────────┘    │
│                                                │
│  ── Links (mt-10, flex gap-4 center) ──        │
│  [SPEC 홈으로 돌아가기]                          │
│   (secondary btn: h-10 rounded-md border       │
│    border-[#ddd9cc] px-4 text-sm               │
│    font-semibold text-[#16140f])               │
│  [Instagram @skku_spec]                         │
│   (text link: text-sm text-[#6b6b5e]           │
│    underline hover:text-[#4a4a40])             │
│                                                │
│  ── Footer note (same as current page) ──      │
│  (mt-16 pb-24 text-[15px] text-[#9a9a8c])     │
└──────────────────────────────────────────────┘
```

**Phone input behavior:**
- Reuse exact formatting logic from `app/apply/form/page.tsx` lines 45-58
- Strip non-digits, format as `XXX-XXXX-XXXX`
- Validate before submit: Korean phone regex `/^01[016789]-?\d{3,4}-?\d{4}$/`
- Submit calls `submitWaitlistPhone(phone)` server action via `useTransition`
- Three states: `idle` | `success` | `duplicate` (controlled by response)

**Note: NO past timeline section.** User explicitly said "굳이 이전 기수의 모집 일정을 보여줄 필요는 없다."

---

### T2.2 — RecruitmentSettingsClient (Admin Form)

**File:** `app/admin/recruitment/RecruitmentSettingsClient.tsx`

**Props:**
```typescript
type Props = {
  allRecruitments: RecruitmentSettings[];
  activeRecruitment: RecruitmentSettings | null;
  waitlistEntries: WaitlistEntry[];
};
```

**Sections:**

1. **Status Control Card** — current status badge + CustomSelect dropdown (4 options) + descriptive text per status + cascade warning when selecting "recruiting"
2. **Batch Info Form** — text inputs for batch, batch_label, short_label, banner_label, hero_badge
3. **Timeline Editor** — dynamic list of steps: title, display date, start date, end date (optional), highlight toggle. Add/remove buttons.
4. **Action Buttons** — "설정 저장" (primary), "새 기수 등록" (secondary, pre-fills form with incremented batch)
5. **Cohort History** — read-only table showing all batches with status badges
6. **Waitlist Section** — "모집 알림 대기자" with count badge, table (phone, created_at, delete button), empty state

All sections follow SPEC admin design patterns: `rounded-lg border border-[#ddd9cc] bg-white`, `px-4 py-3` table cells, SPEC color palette, Pretendard font.

---

### T2.3 — RecruitmentBanner + RecruitmentCard

**RecruitmentBanner** (`components/RecruitmentBanner.tsx`) — Server Component:
- Calls `getActiveRecruitment()` at render
- If `show_banner === false` or no active recruitment → returns `null`
- If `status === "recruiting"` → orange bar: `bg-[#FF6C0F]` with `{bannerLabel} — 지원 마감 {ddayLabel}` + arrow icon + link to /apply
- If `status === "reviewing"` → muted bar: `bg-[#16140f]` with "심사가 진행 중입니다"
- If `status === "upcoming"` → orange bar: `bg-[#FF6C0F]` with "다음 모집이 준비 중입니다"
- Reuses exact banner HTML structure from `components/layout/Navbar.tsx` lines 122-144

**RecruitmentCard** (`components/RecruitmentCard.tsx`) — Server Component:
- Calls `getActiveRecruitment()` at render
- If null or `status === "closed"` → returns `null`
- Content driven entirely by DB fields (batch_label, hero_badge, banner_label)
- Status-specific display:
  - `recruiting`: CTA card with D-day + "지원하기" link to /apply
  - `reviewing`: Info card "심사가 진행 중입니다"
  - `upcoming`: Teaser card "다음 모집을 준비 중입니다"
- Follows SPEC public page patterns: `mx-auto max-w-[960px] px-6`, `rounded-lg border border-[#ddd9cc] bg-white p-8`

---

### T3.4 — Layout + Homepage Wiring

**app/layout.tsx changes:**
```tsx
// BEFORE:
<Navbar />

// AFTER:
<RecruitmentBanner />
<Navbar />
```

`RecruitmentBanner` is a server component — no data passing needed. It fetches its own data. Sits physically above the Navbar in the DOM so the banner appears at the very top of the page.

**app/page.tsx changes:**
```tsx
// Between Manifesto and AlumniGrid:
<div className="landing-section relative z-10 py-8 md:py-16">
  <div className="mx-auto max-w-[960px] px-6">
    <RecruitmentCard />
  </div>
</div>
```

`RecruitmentCard` is also a server component — self-fetching. Returns `null` when there's nothing to show, so the section gracefully disappears.

---

## Atomic Commit Strategy

| # | Message | Wave | Key Files |
|---|---------|------|-----------|
| 1 | `feat(db): add recruitment_settings table with status-driven control` | W0 | 025-*.sql, migration |
| 2 | `feat(db): add recruitment_waitlist table for phone collection` | W0 | 026-*.sql, migration |
| 3 | `feat(types): add Zod schemas and DB types for recruitment system` | W0 | lib/types/recruitment.ts, lib/supabase/types.ts |
| 4 | `feat(actions): add recruitment and waitlist server actions` | W1 | lib/actions/recruitment.ts |
| 5 | `refactor(recruitment-schedule): make DB-aware with sync fallback` | W1 | lib/recruitment-schedule.ts |
| 6 | `test(recruitment): add unit tests for validation, timeline, and status` | W1 | __tests__/lib/recruitment.test.ts |
| 7 | `feat(apply): add recruitment closed view with waitlist phone input` | W2 | app/apply/RecruitmentClosedView.tsx |
| 8 | `feat(admin): add recruitment settings form with status control and waitlist` | W2 | RecruitmentSettingsClient.tsx |
| 9 | `feat(site): add data-driven recruitment banner and homepage card` | W2 | RecruitmentBanner.tsx, RecruitmentCard.tsx |
| 10 | `feat(apply): conditionally show closed/open state from DB` | W3 | app/apply/page.tsx |
| 11 | `feat(apply): guard form and edit routes against closed recruitment` | W3 | form/page.tsx, edit/page.tsx |
| 12 | `feat(admin): add recruitment settings page with nav item` | W3 | page.tsx, loading.tsx, AdminSidebar.tsx |
| 13 | `feat(site): wire recruitment banner and card into layout and homepage` | W3 | app/layout.tsx, app/page.tsx |
| 14 | `feat(applications): server-side submission guard` | W4 | lib/actions/applications.ts |
| 15 | `feat(admin): add batch filtering to applications page` | W4 | ApplicationsClient.tsx |
| 16 | `test(e2e): add recruitment management end-to-end tests` | W5 | e2e/*.spec.ts |

---

## Guardrails

### Must Have
- **Status-driven cascade**: ONE admin status change → banner, homepage card, apply page, form access ALL update automatically
- DB-driven recruitment state (no more hardcoded dates for runtime behavior)
- Admin can create new cohort, set status, edit labels/timeline — all without code
- Polished "not recruiting" closed page with inspirational Korean copy
- Phone waitlist input with XXX-XXXX-XXXX formatting on closed page
- Admin can view and delete waitlist phone numbers
- Server-side form guards (prevent submissions when closed)
- Batch filtering in admin applications
- Backward compatibility — existing imports from `recruitment-schedule.ts` must not break
- SPEC design system compliance on all new UI
- All text `font-['Pretendard',sans-serif]` (except H1 which is system-ui)

### Must NOT Have
- No past timeline section on closed page (explicitly removed by user)
- No hardcoded recruitment cards — all content from DB
- No auto-notification system (just phone collection for now)
- No new color values outside SPEC palette
- No emojis in UI — lucide-react icons only
- No shadows on cards/tables — borders only
- No `rounded-3xl`, `rounded-2xl` — use `rounded-lg`
- No API routes — server actions only
- No modifications to `components/layout/Navbar.tsx` (dead file, not used)

---

## Success Criteria

1. **"노코드" operator test:** Admin → "모집 설정" → creates batch "5" → fills labels → adds timeline → sets status "모집 중" → saves. **Result:** banner appears site-wide; homepage card appears; `/apply` shows open flow; 4기 auto-closed.

2. **Status cascade test:** Admin changes to "심사 중" → banner updates; card updates; `/apply` shows review messaging; form blocked. Admin changes to "모집 마감" → banner hidden; card hidden; `/apply` shows inspirational closed page with phone input.

3. **Waitlist test:** Visitor on closed `/apply` → enters 010-1234-5678 → sees "등록되었습니다" → enters same number again → sees "이미 등록된 번호입니다". Admin sees phone in waitlist table.

4. **Batch filter test:** Admin → 지원서 → batch dropdown defaults to latest → switches to older batch → list filters instantly → "전체" shows all.

5. **Guard test:** `/apply/form` redirects when closed. `submitApplication()` returns error when closed.

6. **Design compliance:** All new UI passes SPEC design system review. No forbidden patterns.

7. **Backward compatibility:** `tsc --noEmit` passes. `npm run build` succeeds. All existing pages work.

---

## Ultrawork Execution Configuration

| Wave | Workers | Tasks | Est. Time |
|------|---------|-------|-----------|
| W0 | 3 | T0.1, T0.2, T0.3 | ~10 min |
| W1 | 3 | T1.1, T1.2, T1.3 | ~15 min |
| W2 | 3 | T2.1, T2.2, T2.3 | ~20 min |
| W3 | 2 | T3.1+T3.2, T3.3+T3.4 | ~15 min |
| W4 | 2 | T4.1, T4.2 | ~10 min |
| W5 | 3 | T5.1, T5.2, T5.3 | ~10 min |

**Skills per task:**
- W2 (T2.1, T2.2, T2.3): load `frontend-ui-ux`
- All others: standard executor (no skills)

**TDD order:** acceptance criteria → test skeleton → implement → verify → refactor

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Navbar is client component — can't server-fetch | HIGH | Separate `RecruitmentBanner` server component above Navbar in layout.tsx |
| `set_updated_at()` function may already exist | MEDIUM | Use `CREATE OR REPLACE FUNCTION` for idempotency |
| Multiple non-closed statuses conflict | MEDIUM | `updateRecruitmentStatus` enforces: "recruiting" auto-closes all others |
| Type regeneration breaks existing code | HIGH | Manual type addition; verify `tsc --noEmit` |
| Phone PII in waitlist | MEDIUM | RLS: only admin SELECT; rate limiting on INSERT |
| Supabase unavailable during deployment | LOW | Hardcoded fallback in recruitment-schedule.ts covers transition period |

---

## Dependency Graph

```
Wave 0:  T0.1 ──┐     T0.2 ──┐     T0.3 ──┐
                 │             │             │
                 ▼             ▼             ▼
Wave 1:  T1.1 ────────────── T1.2 ──────── T1.3
          │                    │
          ▼                    ▼
Wave 2:  T2.1 ──┐     T2.2 ──┐     T2.3 ──┐
                 │             │             │
                 ▼             ▼             ▼
Wave 3:  T3.1 → T3.2         T3.3   T3.4
          │                    │      │
          ▼                    ▼      ▼
Wave 4:  T4.1 ────────────── T4.2
                               │
                               ▼
Wave 5:  T5.1 ──┐     T5.2 ──┐     T5.3
```

Arrows down = depends on entire wave above completing.
T3.1 → T3.2 = sequential within worker (apply page must work before form guard).
All others within a wave = fully parallel.
