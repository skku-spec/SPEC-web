# Admin System Overhaul — SPEC Web

## TL;DR

> **Quick Summary**: Make the SPEC admin panel fully operable by non-developers. Replace all hardcoded content with database-driven admin pages. Overhaul member management as the highest-priority gap.
>
> **Deliverables**:
> - Full CRUD member management page (members table, profile linkage, photo upload, CSV export)
> - Site settings admin page (contact info, social links, footer)
> - Fixed admin navigation (3 hidden pages revealed, mobile nav bug fixed)
> - Accepted→member conversion workflow
> - Homework deadline support
> - Application form builder, curriculum manager, FAQ manager (Phase 2)
> - Partners manager, library migration, audit logging, analytics (Phase 3)
> - Refactored public pages (/people, /contact, /footer, /curriculum, /faq) reading from DB
>
> **Estimated Effort**: XL (3 phases, 27 tasks)
> **Parallel Execution**: YES — 8 waves
> **Critical Path**: T1→T4→T7→T11 (DB migrations → settings actions → settings page → contact/footer refactors)

---

## Context

### Original Request
"비개발자가 관리자 페이지에서 웬만하면 다 설정할 수 있게 만들고 싶다" — Make almost everything configurable from the admin panel by non-developers.

### Interview Summary
**Key Decisions**:
- **Members architecture (Option B)**: Keep `profiles` (auth/public) and `members` (internal) tables separate. Improve linkage via `public_profile_id`. Admin CRUDs on `members` directly.
- **DB-ify threshold**: YES for member data, curriculum weeks, FAQ, site settings, partners, form questions. NO for philosophy, manifesto, TwoTracks, CurriculumRoadmap phases.
- **Accepted→member conversion**: Admin-triggered button with pre-filled form, not fully automatic.
- **Homework deadlines**: Simple `due_date` column, "마감" badge, no per-user overrides.
- **Test strategy**: TDD with existing vitest + Playwright. Tests alongside implementation.
- **Scope**: All 3 phases in one plan. Phase 1 immediate build, Phase 2-3 roadmap.

### Gap Analysis (Self-Review)

**Gaps Identified & Resolved**:
1. **Member photo upload**: Members have `photo_url` field. Currently photos are in `/public/images/member/`. Use Supabase Storage for new uploads — admin uploads photo, gets URL stored in `photo_url`. *Default applied.*
2. **CSV export format**: Export all member fields as CSV with headers. Standard format. *Default applied.*
3. **Batch creation**: `runner_batch` and `preneur_batch` are free-text fields (e.g., "4기"). Admin types batch string when creating member. *No schema change needed.*
4. **Application field name bugs**: `portfolio_url` used for Q4 (Friday participation), `experience_extra` for Q5 (team role). *Not fixing in this plan — separate cleanup task. Conversion action maps current field names as-is.*
5. **Empty state handling**: All new DB-driven pages must fall back to sensible defaults or empty states when tables are empty. *Guardrail added to all tasks.*
6. **Member duplicate detection**: Warn admin if `student_id` already exists when creating a member. *Added to T3 acceptance criteria.*
7. **Site settings fallbacks**: Components reading from site_settings must have hardcoded fallback values in case settings are missing. *Guardrail added.*

**Scope Boundaries Locked**:
- IN: Everything listed in phases 1-3
- OUT: Notification system (email/SMS — too complex, defer), role-based admin page access (all preneur+ see everything — unchanged), rich text editor for FAQ (plain text/markdown only), drag-and-drop reordering (sort_order numbers only), image cropping/resizing, blog data migration

---

## Work Objectives

### Core Objective
Enable non-developer admins to manage members, site content, recruitment forms, curriculum, FAQ, and partners entirely through the admin panel — eliminating all developer-dependent configuration.

### Concrete Deliverables
- `/admin/members` — Full CRUD on members table with profile linkage
- `/admin/settings` — Grouped site settings editor (contact, social, footer)
- `/admin/form-builder` — Customizable application form questions per batch
- `/admin/curriculum` — Curriculum week/area content editor
- `/admin/faq` — FAQ section/item manager
- `/admin/partners` — Partner logo/name manager
- Updated sidebar navigation with all admin pages visible
- Refactored `/people`, `/contact`, footer, `/curriculum`, `/demoday/faq`, `/apply/form` to read from DB
- Member conversion workflow on applications page
- Homework `due_date` support
- Audit logging middleware
- Analytics CSV export

### Definition of Done
- [ ] `npm run build` passes with zero errors
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes
- [ ] All new server actions have vitest unit tests
- [ ] All admin pages render correctly on desktop and mobile
- [ ] All previously hardcoded content is now editable via admin
- [ ] /people page works without MEMBER_PHOTOS map
- [ ] Contact page reads from site_settings
- [ ] Footer reads social links from site_settings

### Must Have
- Full CRUD (create, read, update, delete) on members table
- Profile linkage management (link/unlink member ↔ profile)
- Member photo upload to Supabase Storage
- Site settings key-value store with typed values
- Contact info, social links, footer links configurable from admin
- Admin nav showing ALL admin pages (no hidden pages)
- Mobile nav parity with desktop
- Accepted→member conversion button
- Homework due_date field with "마감" badge
- All public pages with DB fallbacks for empty data

### Must NOT Have (Guardrails)
- DO NOT modify `profiles` table schema (auth-linked, fragile)
- DO NOT change `member_type` enum values without migration
- DO NOT break existing blog author profile functionality
- DO NOT add drag-and-drop UI (use sort_order number inputs)
- DO NOT add rich text editors (plain text/markdown only)
- DO NOT add email/SMS notifications
- DO NOT modify RLS policies without explicit test coverage
- DO NOT use emojis in UI (lucide-react icons only, per design system)
- DO NOT use `shadow-lg/xl`, `rounded-3xl`, `hover:scale` transforms (SPEC design system)
- DO NOT pass functions/components from Server to Client components as props

---

## Database Schema Designs

### New Table: `site_settings` (Phase 1)
```sql
-- scripts/sql/027-site-settings.sql
CREATE TABLE site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  label text NOT NULL DEFAULT '',
  description text,
  value_type text NOT NULL DEFAULT 'string' CHECK (value_type IN ('string', 'url', 'email', 'json')),
  sort_order int NOT NULL DEFAULT 0,
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger for updated_at
CREATE TRIGGER set_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_settings_read_all" ON site_settings FOR SELECT USING (true);
CREATE POLICY "site_settings_admin_modify" ON site_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'mentor'))
  );

-- Seed data
INSERT INTO site_settings (key, value, category, label, value_type, sort_order) VALUES
  ('contact_general_email', 'specskku@gmail.com', 'contact', '일반 문의', 'email', 1),
  ('contact_apply_email', 'specskku@gmail.com', 'contact', '지원 문의', 'email', 2),
  ('contact_partnership_email', 'specskku@gmail.com', 'contact', '제휴 문의', 'email', 3),
  ('contact_press_email', 'specskku@gmail.com', 'contact', '언론 문의', 'email', 4),
  ('contact_office_address', '서울특별시 종로구 성균관로 25-2 성균관대학교', 'contact', '사무실 주소', 'string', 5),
  ('social_instagram', 'https://www.instagram.com/spec.skku/', 'social', 'Instagram', 'url', 1),
  ('social_linkedin', 'https://www.linkedin.com/company/specskku/', 'social', 'LinkedIn', 'url', 2),
  ('social_website', 'https://specskku.com', 'social', '웹사이트', 'url', 3);
```

### Alter Table: `homeworks` (Phase 1)
```sql
-- scripts/sql/028-homework-due-date.sql
ALTER TABLE homeworks ADD COLUMN due_date timestamptz;
```

### New Table: `application_form_fields` (Phase 2)
```sql
-- scripts/sql/029-application-form-fields.sql
CREATE TABLE application_form_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch text NOT NULL,
  field_name text NOT NULL,
  label text NOT NULL,
  description text,
  field_type text NOT NULL DEFAULT 'textarea' CHECK (field_type IN ('text', 'textarea', 'select', 'number')),
  required boolean NOT NULL DEFAULT true,
  min_length int,
  max_length int DEFAULT 5000,
  placeholder text,
  options jsonb,
  step_number int NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(batch, field_name)
);

-- RLS: public read (for form rendering), admin write
ALTER TABLE application_form_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "form_fields_read_all" ON application_form_fields FOR SELECT USING (true);
CREATE POLICY "form_fields_admin_modify" ON application_form_fields
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'mentor'))
  );
```

### New Tables: `curriculum_weeks` + `curriculum_areas` (Phase 2)
```sql
-- scripts/sql/030-curriculum-tables.sql
CREATE TABLE curriculum_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track text NOT NULL CHECK (track IN ('learner', 'preneur', 'vcc')),
  week_number int,
  week_label text NOT NULL,
  topic text NOT NULL,
  objectives text,
  assignment text,
  notes text,
  batch text NOT NULL DEFAULT 'default',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE curriculum_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track text NOT NULL CHECK (track IN ('preneur', 'vcc')),
  area_number text NOT NULL,
  title text NOT NULL,
  subtitle text,
  description text,
  activities jsonb NOT NULL DEFAULT '[]',
  batch text NOT NULL DEFAULT 'default',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for both
ALTER TABLE curriculum_weeks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "curriculum_weeks_read_all" ON curriculum_weeks FOR SELECT USING (true);
CREATE POLICY "curriculum_weeks_admin_modify" ON curriculum_weeks
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'mentor')));

ALTER TABLE curriculum_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "curriculum_areas_read_all" ON curriculum_areas FOR SELECT USING (true);
CREATE POLICY "curriculum_areas_admin_modify" ON curriculum_areas
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'mentor')));
```

### New Table: `faq_items` (Phase 2)
```sql
-- scripts/sql/031-faq-tables.sql
CREATE TABLE faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL,
  section_title text NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faq_items_read_all" ON faq_items FOR SELECT USING (true);
CREATE POLICY "faq_items_admin_modify" ON faq_items
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'mentor')));
```

### New Table: `partners` (Phase 3)
```sql
-- scripts/sql/032-partners.sql
CREATE TABLE partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text NOT NULL,
  website_url text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partners_read_all" ON partners FOR SELECT USING (true);
CREATE POLICY "partners_admin_modify" ON partners
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'mentor')));
```

### New Table: `audit_logs` (Phase 3)
```sql
-- scripts/sql/033-audit-logs.sql
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_admin_read" ON audit_logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'mentor')));
CREATE POLICY "audit_logs_admin_insert" ON audit_logs
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'mentor')));
```

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (vitest + Playwright)
- **Automated tests**: TDD — write tests alongside implementation
- **Framework**: vitest for unit tests (server actions), Playwright for e2e (admin pages)
- **Each task**: RED (failing test) → GREEN (minimal impl) → REFACTOR

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Admin pages (CRUD)**: Playwright — navigate, fill forms, submit, verify table updates, screenshot
- **Server actions**: vitest — call action with valid/invalid inputs, assert results
- **Public page refactors**: Playwright — verify page renders with DB data, test fallbacks
- **API/DB**: Bash (curl/supabase CLI) — verify RLS policies, test migrations

---

## Execution Strategy

### Parallel Execution Waves

```
PHASE 1 — IMMEDIATE BUILD
══════════════════════════

Wave 1 (Foundation — 5 parallel tasks):
├── T1:  DB migrations (site_settings + homework due_date + seed)  [quick]
├── T2:  Fix admin navigation (sidebar + mobile)                    [quick]
├── T3:  Members CRUD server actions + tests                        [unspecified-high]
├── T4:  Site settings CRUD server actions + tests                   [unspecified-high]
└── T5:  Accepted→member conversion action + test                   [deep]

Wave 2 (Admin Pages — 4 parallel tasks, depend on Wave 1):
├── T6:  Members admin page (full CRUD, search, filters, photos)    [visual-engineering]
├── T7:  Site settings admin page (grouped editors)                  [visual-engineering]
├── T8:  Member conversion UI (button + form on applications page)   [unspecified-high]
└── T9:  Homework due_date UI + action update                       [quick]

Wave 3 (Public Page Refactors — 3 parallel tasks, depend on Wave 2):
├── T10: Refactor /people page (remove hardcoded photos/leads)       [unspecified-high]
├── T11: Refactor /contact page (read from site_settings)            [quick]
└── T12: Refactor footer (read social links from site_settings)      [quick]


PHASE 2 — BEFORE NEXT COHORT
═════════════════════════════

Wave 4 (Foundation — 3 parallel tasks):
├── T13: Application form builder: schema + actions + tests + seed   [deep]
├── T14: Curriculum manager: schema + actions + tests + seed         [unspecified-high]
└── T15: FAQ manager: schema + actions + tests + seed                [unspecified-high]

Wave 5 (Admin Pages — 3 parallel tasks, depend on Wave 4):
├── T16: Application form builder admin page                         [deep]
├── T17: Curriculum manager admin page                               [visual-engineering]
└── T18: FAQ manager admin page                                      [visual-engineering]

Wave 6 (Public Page Updates — 3 parallel tasks, depend on Wave 5):
├── T19: Update /apply form to read questions from DB                [deep]
├── T20: Update /curriculum page to read from DB                     [unspecified-high]
└── T21: Update /demoday/faq page to read from DB                   [quick]


PHASE 3 — OPERATIONAL ENHANCEMENT
══════════════════════════════════

Wave 7 (Foundation + Pages — 3 parallel tasks):
├── T22: Partners manager: schema + actions + admin page + seed      [unspecified-high]
├── T23: Library migration: seed DB + update admin/library page      [unspecified-high]
└── T24: Audit logging: schema + middleware utility                  [deep]

Wave 8 (Integration — 3 parallel tasks, depend on Wave 7):
├── T25: Update partners component to read from DB                   [quick]
├── T26: Analytics dashboard + CSV export                            [unspecified-high]
└── T27: Wire audit logging into all admin server actions             [unspecified-high]


FINAL VERIFICATION (4 parallel tasks, depend on ALL):
├── F1:  Plan compliance audit                                       [oracle]
├── F2:  Code quality review                                         [unspecified-high]
├── F3:  Full manual QA                                              [unspecified-high]
└── F4:  Scope fidelity check                                        [deep]
→ Present results → Get explicit user okay
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| T1 | — | T4, T7, T9, T11, T12 | 1 |
| T2 | — | — | 1 |
| T3 | — | T6, T8, T10 | 1 |
| T4 | — | T7, T11, T12 | 1 |
| T5 | — | T8 | 1 |
| T6 | T3 | T10 | 2 |
| T7 | T4 | T11, T12 | 2 |
| T8 | T3, T5 | — | 2 |
| T9 | T1 | — | 2 |
| T10 | T6 | — | 3 |
| T11 | T7 | — | 3 |
| T12 | T7 | — | 3 |
| T13 | — | T16, T19 | 4 |
| T14 | — | T17, T20 | 4 |
| T15 | — | T18, T21 | 4 |
| T16 | T13 | T19 | 5 |
| T17 | T14 | T20 | 5 |
| T18 | T15 | T21 | 5 |
| T19 | T16 | — | 6 |
| T20 | T17 | — | 6 |
| T21 | T18 | — | 6 |
| T22 | — | T25 | 7 |
| T23 | — | — | 7 |
| T24 | — | T27 | 7 |
| T25 | T22 | — | 8 |
| T26 | — | — | 8 |
| T27 | T24 | — | 8 |

### Agent Dispatch Summary

| Wave | Count | Tasks → Categories |
|------|-------|--------------------|
| 1 | 5 | T1→`quick`, T2→`quick`, T3→`unspecified-high`, T4→`unspecified-high`, T5→`deep` |
| 2 | 4 | T6→`visual-engineering`, T7→`visual-engineering`, T8→`unspecified-high`, T9→`quick` |
| 3 | 3 | T10→`unspecified-high`, T11→`quick`, T12→`quick` |
| 4 | 3 | T13→`deep`, T14→`unspecified-high`, T15→`unspecified-high` |
| 5 | 3 | T16→`deep`, T17→`visual-engineering`, T18→`visual-engineering` |
| 6 | 3 | T19→`deep`, T20→`unspecified-high`, T21→`quick` |
| 7 | 3 | T22→`unspecified-high`, T23→`unspecified-high`, T24→`deep` |
| 8 | 3 | T25→`quick`, T26→`unspecified-high`, T27→`unspecified-high` |
| FINAL | 4 | F1→`oracle`, F2→`unspecified-high`, F3→`unspecified-high`, F4→`deep` |

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info + QA Scenarios.
> **A task WITHOUT QA Scenarios is INCOMPLETE. No exceptions.**

### PHASE 1 — IMMEDIATE BUILD

#### Wave 1 — Foundation (5 parallel tasks, no dependencies)

- [ ] 1. DB Migrations: site_settings table + homework due_date column

  **What to do**:
  - Create `scripts/sql/027-site-settings.sql` with the `site_settings` table schema from the Database Schema Designs section above. Include the `update_modified_column` trigger, RLS policies (public read, admin/mentor write), and seed data for contact emails, social links, and office address.
  - Create `scripts/sql/028-homework-due-date.sql` with `ALTER TABLE homeworks ADD COLUMN due_date timestamptz;`
  - Verify SQL syntax is valid by reading existing migration files for pattern reference (e.g., `scripts/sql/025-recruitment-settings.sql`).
  - Ensure the `update_modified_column()` function is referenced (it already exists from earlier migrations — verify by reading `scripts/sql/001-init.sql`).

  **Must NOT do**:
  - Do NOT run these migrations — just write the SQL files
  - Do NOT modify existing migration files
  - Do NOT create tables that already exist

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Writing 2 SQL files following established patterns — minimal complexity
  - **Skills**: []
    - No special skills needed for SQL file creation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T2, T3, T4, T5)
  - **Blocks**: T4, T7, T9, T11, T12 (tasks that depend on these tables)
  - **Blocked By**: None

  **References**:
  - `scripts/sql/025-recruitment-settings.sql` — Follow this migration pattern for table structure, RLS policies, and trigger setup
  - `scripts/sql/001-init.sql` — Verify `update_modified_column()` function exists
  - `scripts/sql/018-create-homeworks-table.sql` — Current homeworks schema to verify ALTER compatibility
  - Database Schema Designs section of this plan — exact SQL for both tables

  **Acceptance Criteria**:
  - [ ] `scripts/sql/027-site-settings.sql` exists with correct CREATE TABLE, trigger, RLS, and INSERT seed data
  - [ ] `scripts/sql/028-homework-due-date.sql` exists with correct ALTER TABLE
  - [ ] SQL syntax validates (no typos, correct references)
  - [ ] Seed data includes all 8 settings (4 emails, 1 address, 3 social links)

  **QA Scenarios**:
  ```
  Scenario: Verify SQL file syntax and completeness
    Tool: Bash
    Steps:
      1. Read scripts/sql/027-site-settings.sql — verify CREATE TABLE site_settings with all columns (id, key, value, category, label, description, value_type, sort_order, updated_by, created_at, updated_at)
      2. Verify RLS policies exist: site_settings_read_all (SELECT), site_settings_admin_modify (ALL)
      3. Count INSERT statements — expect exactly 8 seed rows
      4. Read scripts/sql/028-homework-due-date.sql — verify ALTER TABLE homeworks ADD COLUMN due_date timestamptz
    Expected Result: Both files exist, contain valid SQL, seed data has 8 rows
    Evidence: .sisyphus/evidence/task-1-sql-syntax.txt

  Scenario: Verify no conflicts with existing migrations
    Tool: Bash
    Steps:
      1. Search all existing SQL files for "site_settings" — expect 0 matches (table doesn't exist yet)
      2. Search all existing SQL files for "due_date" in homeworks context — expect 0 matches
      3. Verify 027 and 028 numbers don't collide with existing files
    Expected Result: No naming conflicts, no duplicate table/column definitions
    Evidence: .sisyphus/evidence/task-1-no-conflicts.txt
  ```

  **Commit**: YES
  - Message: `chore(db): add site_settings table and homework due_date column`
  - Files: `scripts/sql/027-site-settings.sql`, `scripts/sql/028-homework-due-date.sql`

---

- [ ] 2. Fix Admin Navigation: add hidden pages and fix mobile nav

  **What to do**:
  - In `app/admin/AdminSidebar.tsx`: Add nav items for Jobs, Launches, Library, Members (pointing to `/admin/members`), and Settings to the `NAV_ITEMS` array. Use appropriate lucide-react icons: `Briefcase` (jobs), `Rocket` (launches), `Library` (library), `Settings` (settings). Change existing "멤버" item to label "멤버 관리" with href `/admin/members`. Keep existing "멤버" entry pointing to `/admin/users` but rename to "사용자 계정" (or similar).
  - In `app/admin/AdminNav.tsx`: Fix the missing `CalendarDays` import. Add the attendance nav item that's currently missing from mobile. Add all the same new items as sidebar. Ensure mobile nav has exact parity with desktop sidebar.
  - Verify all target pages exist: `/admin/jobs`, `/admin/launches`, `/admin/library` (they exist). `/admin/members` and `/admin/settings` will be created in Wave 2 — that's OK.

  **Must NOT do**:
  - Do NOT create any new pages — just update navigation components
  - Do NOT change the admin layout auth logic
  - Do NOT remove any existing nav items

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Modifying 2 existing files with simple array additions — trivial change
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T3, T4, T5)
  - **Blocks**: None (standalone fix)
  - **Blocked By**: None

  **References**:
  - `app/admin/AdminSidebar.tsx:1-30` — Current NAV_ITEMS array structure with icons, labels, hrefs
  - `app/admin/AdminNav.tsx` — Mobile nav with same structure but missing attendance item
  - `app/admin/jobs/page.tsx` — Verify jobs page exists
  - `app/admin/launches/page.tsx` — Verify launches page exists
  - `app/admin/library/page.tsx` — Verify library page exists

  **Acceptance Criteria**:
  - [ ] AdminSidebar shows: 대시보드, 멤버 관리, 사용자 계정, 지원서, 모집 설정, 게시물, 과제, 출석, 채용, 런칭, 자료실, 설정
  - [ ] AdminNav (mobile) has exact same items as AdminSidebar
  - [ ] CalendarDays icon properly imported in AdminNav
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Verify sidebar renders all nav items
    Tool: Bash
    Steps:
      1. Read app/admin/AdminSidebar.tsx — find NAV_ITEMS array
      2. Count items — expect 12 nav items
      3. Verify hrefs include: /admin, /admin/members, /admin/users, /admin/applications, /admin/recruitment, /admin/posts, /admin/homework, /admin/attendance, /admin/jobs, /admin/launches, /admin/library, /admin/settings
      4. Verify each item has icon, label, href properties
    Expected Result: 12 nav items with correct structure
    Evidence: .sisyphus/evidence/task-2-sidebar-items.txt

  Scenario: Verify mobile nav parity
    Tool: Bash
    Steps:
      1. Read app/admin/AdminNav.tsx — find NAV_ITEMS array
      2. Compare item count with AdminSidebar — must match
      3. Verify CalendarDays is imported from lucide-react
      4. Run `npm run build` — expect success
    Expected Result: Mobile nav matches desktop, build passes
    Evidence: .sisyphus/evidence/task-2-mobile-nav.txt
  ```

  **Commit**: YES
  - Message: `fix(admin): add hidden pages to sidebar and fix mobile nav`
  - Files: `app/admin/AdminSidebar.tsx`, `app/admin/AdminNav.tsx`

---

- [ ] 3. Members CRUD Server Actions + Unit Tests

  **What to do**:
  - Create `lib/actions/members.ts` with the following server actions:
    - `getAllMembers()` — Fetch all members with LEFT JOIN to profiles via `public_profile_id`. Return member data + linked profile name/role/slug. Support optional filters: `batch` (runner_batch or preneur_batch), `member_type`, search query (name/email/student_id).
    - `getMember(id: string)` — Fetch single member with linked profile data.
    - `createMember(data)` — Create new member. Validate required fields (name, slug). Auto-generate slug from name if not provided. Check for duplicate `student_id` — return warning if exists. Accept optional `public_profile_id` to link profile.
    - `updateMember(id: string, data)` — Update member fields. Validate slug uniqueness.
    - `deleteMember(id: string)` — Delete member. Unlink profile first (set `public_profile_id = null`).
    - `linkMemberProfile(memberId: string, profileId: string)` — Set `public_profile_id` on member. Verify profile exists. Update profile `profile_visibility` to 'public'.
    - `unlinkMemberProfile(memberId: string)` — Set `public_profile_id = null`.
    - `uploadMemberPhoto(memberId: string, file: File)` — Upload photo to Supabase Storage `member-photos` bucket. Update `photo_url` on member.
    - `exportMembersCSV(filters?)` — Generate CSV string from members data with headers.
  - Create `__tests__/actions/members.test.ts` with vitest unit tests for each action.
  - Follow the result pattern from `lib/actions/recruitment.ts`: `{ success?: boolean; error?: string; data?: T }`.
  - All mutations must call `await requireRole("preneur")`.
  - All mutations must call `revalidatePath("/admin/members")` and `revalidatePath("/people")`.

  **Must NOT do**:
  - Do NOT modify the `members` table schema (it already has all needed columns)
  - Do NOT modify the `profiles` table
  - Do NOT create any UI components
  - Do NOT add drag-and-drop or rich text functionality

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multi-function server action module with validation, joins, file upload — moderate complexity
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T2, T4, T5)
  - **Blocks**: T6 (members admin page), T8 (conversion UI), T10 (/people refactor)
  - **Blocked By**: None

  **References**:
  - `lib/actions/recruitment.ts` — **PRIMARY PATTERN**: Follow this exact structure for `"use server"`, `requireRole()`, `createClient()`, try-catch, result types, `revalidatePath()`
  - `lib/actions/posts.ts` — File upload pattern with FormData, slug generation with collision detection
  - `lib/actions/applications.ts` — Validation patterns: regex, length checks
  - `scripts/sql/010-members-projects-migration.sql` — Members table schema (columns, types, constraints)
  - `scripts/sql/018-people-to-profile-linkage.sql` — `public_profile_id` FK relationship
  - `lib/auth.ts` — `requireRole()` function and role hierarchy
  - `lib/supabase/server.ts` — Server-side Supabase client creation pattern

  **Acceptance Criteria**:
  - [ ] `lib/actions/members.ts` exports all 9 functions listed above
  - [ ] All mutations use `requireRole("preneur")` guard
  - [ ] `createMember` warns on duplicate `student_id`
  - [ ] `linkMemberProfile` sets profile visibility to 'public'
  - [ ] `exportMembersCSV` returns valid CSV string with headers
  - [ ] `__tests__/actions/members.test.ts` has tests for each action
  - [ ] `npx vitest run __tests__/actions/members.test.ts` passes

  **QA Scenarios**:
  ```
  Scenario: Verify all member actions are exported and typed
    Tool: Bash
    Steps:
      1. Read lib/actions/members.ts
      2. Verify "use server" directive at top
      3. Verify exports: getAllMembers, getMember, createMember, updateMember, deleteMember, linkMemberProfile, unlinkMemberProfile, uploadMemberPhoto, exportMembersCSV
      4. Verify each function has requireRole("preneur") call
      5. Verify each mutation calls revalidatePath
    Expected Result: All 9 functions exported with proper guards
    Evidence: .sisyphus/evidence/task-3-actions-exports.txt

  Scenario: Verify unit tests cover all actions
    Tool: Bash
    Steps:
      1. Read __tests__/actions/members.test.ts
      2. Count describe/test blocks — expect at least 9 (one per action)
      3. Run `npx vitest run __tests__/actions/members.test.ts`
      4. Verify all tests pass
    Expected Result: All tests pass, every action has coverage
    Evidence: .sisyphus/evidence/task-3-test-results.txt
  ```

  **Commit**: YES
  - Message: `feat(admin): add member management server actions`
  - Files: `lib/actions/members.ts`, `__tests__/actions/members.test.ts`

---

- [ ] 4. Site Settings CRUD Server Actions + Unit Tests

  **What to do**:
  - Create `lib/actions/site-settings.ts` with the following server actions:
    - `getSetting(key: string)` — Fetch single setting by key. Return value with type info.
    - `getSettingsByCategory(category: string)` — Fetch all settings for a category (e.g., 'contact', 'social'). Order by `sort_order`.
    - `getAllSettings()` — Fetch all settings grouped by category.
    - `upsertSetting(key: string, value: string, meta?: { category, label, description, value_type })` — Create or update a setting. Set `updated_by` to current user ID.
    - `bulkUpsertSettings(settings: Array<{key, value}>)` — Update multiple settings at once (for form submissions with multiple fields).
    - `deleteSetting(key: string)` — Delete a setting by key. Admin-only.
  - Create `__tests__/actions/site-settings.test.ts` with vitest tests.
  - Create a helper `lib/site-settings-helpers.ts` with:
    - `getPublicSettings(category: string)` — Non-authenticated read for public pages (contact, footer). Uses Supabase anon key. Includes hardcoded fallback values.
    - Fallback map: `SETTING_DEFAULTS` with all default values for when DB is empty.
  - Follow recruitment.ts patterns: `"use server"`, requireRole, try-catch, revalidatePath.
  - Mutations must revalidate: `/admin/settings`, `/contact`, `/` (for footer).

  **Must NOT do**:
  - Do NOT create the site_settings table (T1 handles that)
  - Do NOT create any UI components
  - Do NOT hardcode settings values in the actions (use the DB seed data from T1)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Standard CRUD actions with typed key-value pattern — moderate complexity
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T2, T3, T5)
  - **Blocks**: T7 (site settings admin page), T11 (contact refactor), T12 (footer refactor)
  - **Blocked By**: None

  **References**:
  - `lib/actions/recruitment.ts` — **PRIMARY PATTERN**: Server action structure, result types, role checks
  - `scripts/sql/027-site-settings.sql` (from T1) — Schema reference for column names and types
  - `lib/supabase/server.ts` — Server client creation
  - `app/contact/page.tsx:1-50` — Current hardcoded values to use as SETTING_DEFAULTS fallbacks

  **Acceptance Criteria**:
  - [ ] `lib/actions/site-settings.ts` exports all 6 actions
  - [ ] `lib/site-settings-helpers.ts` exports `getPublicSettings` and `SETTING_DEFAULTS`
  - [ ] `SETTING_DEFAULTS` includes fallbacks for all 8 seed settings
  - [ ] `bulkUpsertSettings` handles array of key-value pairs atomically
  - [ ] Tests pass: `npx vitest run __tests__/actions/site-settings.test.ts`

  **QA Scenarios**:
  ```
  Scenario: Verify all settings actions and helpers are properly structured
    Tool: Bash
    Steps:
      1. Read lib/actions/site-settings.ts — verify "use server", requireRole("preneur") on mutations
      2. Read lib/site-settings-helpers.ts — verify SETTING_DEFAULTS has 8 entries matching seed data
      3. Verify getPublicSettings returns data without requiring auth (no requireRole)
    Expected Result: All actions exported, helpers have correct defaults
    Evidence: .sisyphus/evidence/task-4-actions-structure.txt

  Scenario: Verify unit tests pass
    Tool: Bash
    Steps:
      1. Run `npx vitest run __tests__/actions/site-settings.test.ts`
      2. Verify at least 6 test cases (one per action)
    Expected Result: All tests pass
    Evidence: .sisyphus/evidence/task-4-test-results.txt
  ```

  **Commit**: YES
  - Message: `feat(admin): add site settings server actions`
  - Files: `lib/actions/site-settings.ts`, `lib/site-settings-helpers.ts`, `__tests__/actions/site-settings.test.ts`

---

- [ ] 5. Accepted-to-Member Conversion Server Action + Test

  **What to do**:
  - Create `lib/actions/member-conversion.ts` with:
    - `getConversionPreview(applicationId: string)` — Fetch application data and return a pre-filled member form data object. Map: `name→name`, `student_id→student_id`, `phone→phone`, `email→email`, `major→major`, `batch→runner_batch`. Generate slug from name. Leave `preneur_batch`, `batch_tags`, `parts`, `notes`, `photo_url`, `public_profile_id` empty for admin to fill.
    - `convertToMember(applicationId: string, memberData: MemberFormData)` — Create a member row from the reviewed/edited form data. Verify application exists and status is 'accepted'. Check for duplicate `student_id` in members table. If application has a `user_id`, attempt to find matching profile and suggest linking. Return created member ID.
  - Create `__tests__/actions/member-conversion.test.ts` with vitest tests.
  - Handle edge cases: application not found, application not in 'accepted' status, duplicate student_id, user_id doesn't match any profile.
  - Revalidate: `/admin/applications`, `/admin/members`, `/people`.

  **Must NOT do**:
  - Do NOT auto-create members without admin review (admin-triggered only)
  - Do NOT modify application status as part of conversion
  - Do NOT auto-link profiles without admin confirmation

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex data mapping between tables with edge case handling — requires careful logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T2, T3, T4)
  - **Blocks**: T8 (conversion UI on applications page)
  - **Blocked By**: None

  **References**:
  - `lib/actions/applications.ts` — Application data shape, field names (name, student_id, email, phone, major, batch, grade, enrollment_status, introduction, vision, startup_idea, portfolio_url, experience_extra, additional_comments)
  - `scripts/sql/010-members-projects-migration.sql` — Members table columns to map into
  - `lib/actions/members.ts` (from T3) — `createMember` action to potentially reuse
  - `lib/actions/recruitment.ts` — Pattern reference for result types and error handling
  - `app/admin/applications/ApplicationsClient.tsx` — How application data is displayed (to understand field usage)

  **Acceptance Criteria**:
  - [ ] `getConversionPreview` returns pre-filled member data from application
  - [ ] `convertToMember` creates member row only for 'accepted' applications
  - [ ] Duplicate student_id in members returns descriptive error
  - [ ] Tests pass: `npx vitest run __tests__/actions/member-conversion.test.ts`

  **QA Scenarios**:
  ```
  Scenario: Verify conversion preview maps fields correctly
    Tool: Bash
    Steps:
      1. Read lib/actions/member-conversion.ts
      2. Verify getConversionPreview maps: name→name, student_id→student_id, phone→phone, email→email, major→major, batch→runner_batch
      3. Verify empty fields: preneur_batch, batch_tags, parts, notes, photo_url
      4. Verify slug generation from name
    Expected Result: All field mappings correct, empty fields properly initialized
    Evidence: .sisyphus/evidence/task-5-field-mapping.txt

  Scenario: Verify conversion rejects non-accepted applications
    Tool: Bash
    Steps:
      1. Read __tests__/actions/member-conversion.test.ts
      2. Find test for non-accepted application — expect error result
      3. Find test for duplicate student_id — expect error result
      4. Run `npx vitest run __tests__/actions/member-conversion.test.ts`
    Expected Result: Edge cases tested, all tests pass
    Evidence: .sisyphus/evidence/task-5-test-results.txt
  ```

  **Commit**: YES
  - Message: `feat(admin): add accepted-to-member conversion action`
  - Files: `lib/actions/member-conversion.ts`, `__tests__/actions/member-conversion.test.ts`

---

#### Wave 2 — Admin Pages (4 parallel tasks, depend on Wave 1)

- [ ] 6. Members Management Admin Page with Full CRUD

  **What to do**:
  - Create `app/admin/members/page.tsx` (server component):
    - Fetch all members with profile joins using `getAllMembers()` from T3
    - Pass data to client component
  - Create `app/admin/members/MembersClient.tsx` (client component):
    - **Table view**: Show members in a table with columns: Name (avatar + name), Student ID, Batch (runner_batch/preneur_batch), Type (러너/프러너/alumni), Parts, Linked Profile (linked/unlinked badge), Actions
    - **Search**: Filter by name, email, student_id (real-time input filter)
    - **Filters**: Dropdown filters for runner_batch, member_type
    - **Create**: "멤버 추가" button opens a form (modal or inline) with all member fields. Include slug auto-generation from name. Include photo upload (file input → `uploadMemberPhoto` action).
    - **Edit**: Click member row → edit form with all current values. Include photo preview/change.
    - **Delete**: Delete button with confirmation dialog.
    - **Profile Linkage**: For each member, show link/unlink button. Link action shows a searchable dropdown of unlinked profiles. Unlink removes the association.
    - **CSV Export**: "CSV 내보내기" button calls `exportMembersCSV` and triggers download.
    - **Responsive**: Desktop table `hidden sm:block`, mobile card list `sm:hidden`
    - **Loading/Error/Toast**: Use the patterns from RecruitmentSettingsClient (loading overlay, success toast, error alert)
  - Follow SPEC design system strictly: correct hex colors, Pretendard font, rounded-lg borders, h-8 buttons, no emojis.

  **Must NOT do**:
  - Do NOT use emojis anywhere in the UI
  - Do NOT use `shadow-lg`, `rounded-3xl`, or `hover:scale` transforms
  - Do NOT implement drag-and-drop reordering
  - Do NOT pass functions from Server to Client components

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex admin UI with table, forms, modals, file upload — heavy frontend work
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Needed for complex form/table UI design and responsive layout

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T7, T8, T9)
  - **Blocks**: T10 (/people refactor)
  - **Blocked By**: T3 (members server actions)

  **References**:
  - `app/admin/recruitment/RecruitmentSettingsClient.tsx` — **PRIMARY UI PATTERN**: Form state, useTransition, loading overlay, success toast, error alert, collapsible sections, responsive table/cards
  - `app/admin/recruitment/page.tsx` — Server component data fetching pattern
  - `app/admin/users/UsersClient.tsx` — Search filter pattern, role dropdown (CustomSelect), table layout
  - `app/admin/applications/ApplicationsClient.tsx` — Batch filter dropdown, status badges
  - `lib/actions/members.ts` (from T3) — All available server actions to call
  - `app/admin/AdminSidebar.tsx` — Verify `/admin/members` is in NAV_ITEMS (from T2)
  - AGENTS.md Design System section — ALL styling rules (colors, fonts, spacing, icons, forbidden patterns)

  **Acceptance Criteria**:
  - [ ] `app/admin/members/page.tsx` server component fetches members data
  - [ ] `app/admin/members/MembersClient.tsx` renders table with all required columns
  - [ ] Create/Edit/Delete member functionality works
  - [ ] Photo upload works (file input → Supabase Storage)
  - [ ] Profile link/unlink works with searchable dropdown
  - [ ] CSV export triggers file download
  - [ ] Search and filter (batch, type) work
  - [ ] Mobile responsive (card view on small screens)
  - [ ] SPEC design system fully complied with
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Verify members page renders with correct layout
    Tool: Playwright
    Steps:
      1. Navigate to /admin/members (must be logged in as admin/preneur)
      2. Verify page title "멤버 관리" exists with h1 styling
      3. Verify table has headers: 이름, 학번, 배치, 유형, 파트, 프로필 연동, 작업
      4. Verify "멤버 추가" button exists with correct styling (h-8 rounded-md bg-[#16140f])
      5. Verify "CSV 내보내기" button exists
      6. Screenshot the page
    Expected Result: Page renders with all expected elements in SPEC design system
    Evidence: .sisyphus/evidence/task-6-members-page.png

  Scenario: Verify member CRUD form fields
    Tool: Bash
    Steps:
      1. Read app/admin/members/MembersClient.tsx
      2. Verify form includes fields: name, slug, student_id, phone, email, major, runner_batch, preneur_batch, batch_tags, member_type, parts, bio, notes, photo upload
      3. Verify all text inputs use: rounded-lg border border-[#ddd9cc] bg-white px-4 py-2.5 font-['Pretendard',sans-serif] text-sm
      4. Verify buttons use h-8 rounded-md styling
      5. Run `npm run build` — expect success
    Expected Result: All fields present, design system compliant, build passes
    Evidence: .sisyphus/evidence/task-6-form-fields.txt
  ```

  **Commit**: YES
  - Message: `feat(admin): add members management page with full CRUD`
  - Files: `app/admin/members/page.tsx`, `app/admin/members/MembersClient.tsx`

---

- [ ] 7. Site Settings Admin Page with Grouped Editors

  **What to do**:
  - Create `app/admin/settings/page.tsx` (server component): Fetch all settings using `getAllSettings()`.
  - Create `app/admin/settings/SiteSettingsClient.tsx` (client component):
    - Group settings by `category` into collapsible sections:
      - **연락처 (Contact)**: Email fields (general, apply, partnership, press) + office address
      - **소셜 미디어 (Social)**: Instagram URL, LinkedIn URL, website URL
    - Each setting renders as a labeled input field (text or URL type based on `value_type`)
    - "저장" (Save) button per section calls `bulkUpsertSettings` with all fields in that section
    - Success toast on save, error alert on failure
    - Loading overlay during save
  - Follow RecruitmentSettingsClient patterns for form state, useTransition, toast/error UI.
  - Use SPEC design system: correct input styling, button styling, section headers.

  **Must NOT do**:
  - Do NOT add settings that aren't seeded in T1
  - Do NOT add a "create new setting" UI (settings are predefined via seed data)
  - Do NOT use rich text editors

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Admin form UI with grouped sections, collapsible panels — frontend-heavy
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Form layout design with grouped sections

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T6, T8, T9)
  - **Blocks**: T11 (contact page refactor), T12 (footer refactor)
  - **Blocked By**: T4 (site settings server actions)

  **References**:
  - `app/admin/recruitment/RecruitmentSettingsClient.tsx` — **PRIMARY PATTERN**: Collapsible sections, form state, useTransition, toast/error, loading overlay
  - `lib/actions/site-settings.ts` (from T4) — `getAllSettings()`, `bulkUpsertSettings()` actions
  - `app/admin/recruitment/page.tsx` — Server component data fetch pattern
  - AGENTS.md Design System — Input styling, button styling, section headers

  **Acceptance Criteria**:
  - [ ] Settings page loads with 2 sections (Contact, Social)
  - [ ] All 8 settings displayed as editable inputs
  - [ ] Save button per section works
  - [ ] Toast shows on successful save
  - [ ] Error shows on failed save
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Verify settings page structure
    Tool: Bash
    Steps:
      1. Read app/admin/settings/SiteSettingsClient.tsx
      2. Verify 2 sections exist: contact (연락처), social (소셜 미디어)
      3. Verify input fields for all 8 settings
      4. Verify "저장" button per section
      5. Run `npm run build`
    Expected Result: All sections and inputs present, build passes
    Evidence: .sisyphus/evidence/task-7-settings-structure.txt

  Scenario: Verify SPEC design system compliance
    Tool: Bash
    Steps:
      1. Grep SiteSettingsClient.tsx for forbidden patterns: shadow-lg, rounded-3xl, hover:scale, emoji
      2. Verify input classes include: rounded-lg border-[#ddd9cc] font-['Pretendard',sans-serif]
      3. Verify button classes include: h-8 rounded-md
    Expected Result: Zero forbidden patterns, correct styling classes
    Evidence: .sisyphus/evidence/task-7-design-compliance.txt
  ```

  **Commit**: YES
  - Message: `feat(admin): add site settings management page`
  - Files: `app/admin/settings/page.tsx`, `app/admin/settings/SiteSettingsClient.tsx`

---

- [ ] 8. Member Conversion UI on Applications Page

  **What to do**:
  - Modify `app/admin/applications/ApplicationsClient.tsx`:
    - For applications with `status === 'accepted'`, add a "멤버 등록" button next to the status badge
    - Clicking the button: call `getConversionPreview(applicationId)` from T5 to get pre-filled data
    - Show a modal/panel with pre-filled member form: name, student_id, phone, email, major, runner_batch (from application batch), slug (auto-generated). Editable fields for: preneur_batch, batch_tags, member_type, parts, notes.
    - "등록" (Register) button calls `convertToMember(applicationId, formData)`
    - On success: toast "멤버로 등록되었습니다" + disable the "멤버 등록" button (show "등록됨" badge)
    - On error: show error alert with message
    - Handle edge case: if student_id already exists in members, show warning but allow override

  **Must NOT do**:
  - Do NOT auto-convert — must require admin confirmation
  - Do NOT modify application status during conversion
  - Do NOT change existing ApplicationsClient table layout (only add button)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Modifying existing component with modal form — standard complexity
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Modal dialog design within existing page

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T6, T7, T9)
  - **Blocks**: None
  - **Blocked By**: T3 (members actions), T5 (conversion action)

  **References**:
  - `app/admin/applications/ApplicationsClient.tsx` — **MODIFY THIS FILE**: Current table structure, status badges, existing button patterns
  - `lib/actions/member-conversion.ts` (from T5) — `getConversionPreview()`, `convertToMember()` actions
  - `app/admin/recruitment/RecruitmentSettingsClient.tsx` — Modal/form patterns, loading overlay, toast
  - AGENTS.md Design System — Button styling for "멤버 등록" button

  **Acceptance Criteria**:
  - [ ] "멤버 등록" button appears only for accepted applications
  - [ ] Clicking button shows pre-filled form modal
  - [ ] Form is editable before submission
  - [ ] Successful conversion shows toast and disables button
  - [ ] Duplicate student_id shows warning
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Verify conversion button visibility
    Tool: Bash
    Steps:
      1. Read app/admin/applications/ApplicationsClient.tsx
      2. Find "멤버 등록" button — verify it's conditionally rendered for status === 'accepted'
      3. Verify modal/panel contains form fields: name, student_id, phone, email, major, runner_batch, preneur_batch, batch_tags, member_type, parts, notes
      4. Run `npm run build`
    Expected Result: Button conditionally rendered, form complete, build passes
    Evidence: .sisyphus/evidence/task-8-conversion-ui.txt

  Scenario: Verify conversion form pre-fill
    Tool: Bash
    Steps:
      1. Read the component to verify getConversionPreview is called on button click
      2. Verify form fields are populated from preview data
      3. Verify "등록" submit button calls convertToMember
    Expected Result: Data flows correctly from preview to form to submission
    Evidence: .sisyphus/evidence/task-8-data-flow.txt
  ```

  **Commit**: YES
  - Message: `feat(admin): add member conversion UI to applications page`
  - Files: `app/admin/applications/ApplicationsClient.tsx`

---

- [ ] 9. Homework Due Date Editing UI + Action Update

  **What to do**:
  - Modify `app/admin/homework/HomeworkClient.tsx`:
    - Add a `due_date` date picker input to the homework create/edit form
    - Display `due_date` in the homework list/table (formatted as YYYY.MM.DD)
    - Show "마감" badge (red, `bg-[#FEE2E2] text-[#b42318]`) next to homework title when `due_date` is past
    - Show "D-N" countdown badge (orange, `bg-[#FFF0E5] text-[#FF6C0F]`) when due_date is within 3 days
  - Update homework server actions (find existing homework action file — likely uses Supabase client directly in HomeworkClient) to include `due_date` in create/update operations.
  - Note: HomeworkClient currently uses client-side Supabase queries (exception to the server action pattern). Follow the existing pattern — add `due_date` to the same queries.

  **Must NOT do**:
  - Do NOT add per-user deadline overrides
  - Do NOT add auto-blocking after deadline
  - Do NOT refactor HomeworkClient to use server actions (keep existing pattern)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Adding one field to existing form + display logic — simple enhancement
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T6, T7, T8)
  - **Blocks**: None
  - **Blocked By**: T1 (DB migration adds due_date column)

  **References**:
  - `app/admin/homework/HomeworkClient.tsx` — **MODIFY THIS FILE**: Current form fields, Supabase client queries, table/card layout
  - `scripts/sql/028-homework-due-date.sql` (from T1) — due_date column definition
  - `scripts/sql/018-create-homeworks-table.sql` — Current homeworks schema

  **Acceptance Criteria**:
  - [ ] Date picker input in homework create/edit form
  - [ ] due_date displayed in homework list
  - [ ] "마감" red badge shows when past due
  - [ ] "D-N" orange countdown shows within 3 days of due
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Verify due_date UI elements
    Tool: Bash
    Steps:
      1. Read app/admin/homework/HomeworkClient.tsx
      2. Find date input for due_date — verify it exists in form
      3. Find "마감" badge — verify conditional rendering for past dates
      4. Find "D-N" badge — verify countdown logic for dates within 3 days
      5. Verify due_date is included in Supabase insert/update queries
    Expected Result: Date input, badges, and query integration all present
    Evidence: .sisyphus/evidence/task-9-due-date-ui.txt

  Scenario: Verify badge styling matches SPEC design system
    Tool: Bash
    Steps:
      1. Find "마감" badge classes — expect bg-[#FEE2E2] text-[#b42318]
      2. Find "D-N" badge classes — expect bg-[#FFF0E5] text-[#FF6C0F]
      3. Verify badges use rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold
    Expected Result: Badge styling matches SPEC design system exactly
    Evidence: .sisyphus/evidence/task-9-badge-styling.txt
  ```

  **Commit**: YES
  - Message: `feat(admin): add homework due_date editing and display`
  - Files: `app/admin/homework/HomeworkClient.tsx`

---

#### Wave 3 — Public Page Refactors (3 parallel tasks, depend on Wave 2)

- [ ] 10. Refactor /people Page: Remove Hardcoded Photos and Lead Detection

  **What to do**:
  - Modify `app/people/page.tsx`:
    - **Remove** the `MEMBER_PHOTOS` hardcoded map (lines ~63-79). Replace with: use `member.photo_url` directly. If `photo_url` is null/empty, fall back to initials avatar (existing pattern with `bg-[#e8e6dc]`).
    - **Remove** the hardcoded name check in `isManagingLead()` (lines ~91-99 checking for "전도현" and "한지상"). Replace with: detect leads purely from `batch_tags` — a member is a managing lead if `batch_tags` includes a tag containing "회장" or "부회장".
    - **Keep** the existing data flow: query members → fetch linked profiles → render. Just change the photo source and lead detection.
    - **Keep** the current batch filter (`preneur_batch = '4기'`). In the future this could be configurable, but for now it stays.
    - Ensure graceful fallback: if no members have photos, show initials avatars. If no leads detected, show empty section.

  **Must NOT do**:
  - Do NOT change the page layout or design
  - Do NOT change the members query structure
  - Do NOT add new database queries
  - Do NOT change the profile linkage resolution logic

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Careful refactor of existing page with data source changes — needs attention to detail
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T11, T12)
  - **Blocks**: None
  - **Blocked By**: T6 (members admin page — ensures photo_url data is manageable)

  **References**:
  - `app/people/page.tsx` — **MODIFY THIS FILE**: Lines ~63-79 (MEMBER_PHOTOS), lines ~91-99 (isManagingLead), photo rendering logic
  - `scripts/sql/010-members-projects-migration.sql` — Members table has `photo_url` column
  - `app/people/[slug]/page.tsx` — Individual member detail page (don't break this)
  - `lib/public-profile.ts` — Profile linkage utilities (don't modify)

  **Acceptance Criteria**:
  - [ ] `MEMBER_PHOTOS` map completely removed
  - [ ] Photos sourced from `member.photo_url` with initials fallback
  - [ ] `isManagingLead` uses only `batch_tags` (no hardcoded names)
  - [ ] Page renders correctly with existing member data
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Verify hardcoded data removed
    Tool: Bash
    Steps:
      1. Read app/people/page.tsx
      2. Search for "MEMBER_PHOTOS" — expect 0 matches
      3. Search for "전도현" — expect 0 matches
      4. Search for "한지상" — expect 0 matches
      5. Verify photo rendering uses member.photo_url || linked profile photo
    Expected Result: All hardcoded data removed, dynamic data sources used
    Evidence: .sisyphus/evidence/task-10-hardcoded-removed.txt

  Scenario: Verify lead detection uses batch_tags
    Tool: Bash
    Steps:
      1. Find isManagingLead function in people/page.tsx
      2. Verify it checks batch_tags for "회장" or "부회장" patterns
      3. Verify NO name-based checks exist
      4. Run `npm run build`
    Expected Result: Lead detection is purely tag-based, build passes
    Evidence: .sisyphus/evidence/task-10-lead-detection.txt
  ```

  **Commit**: YES
  - Message: `refactor(people): replace hardcoded photos and lead detection with DB data`
  - Files: `app/people/page.tsx`

---

- [ ] 11. Refactor Contact Page: Read from site_settings

  **What to do**:
  - Modify `app/contact/page.tsx`:
    - Replace all hardcoded email addresses, office address, and social links with data fetched from `site_settings` table.
    - Use `getPublicSettings('contact')` and `getPublicSettings('social')` from `lib/site-settings-helpers.ts` (T4).
    - These are non-authenticated reads — the helper uses the Supabase anon key.
    - Keep `SETTING_DEFAULTS` as fallback: if a setting is missing from DB, use the hardcoded default.
    - Page is a server component — fetch data at render time.
    - Keep the exact same visual layout and design.

  **Must NOT do**:
  - Do NOT change the page layout or design
  - Do NOT add admin editing UI to this page
  - Do NOT remove the fallback defaults (page must work even if site_settings is empty)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple data source swap in a server component — straightforward refactor
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T10, T12)
  - **Blocks**: None
  - **Blocked By**: T7 (site settings admin page — ensures settings are editable)

  **References**:
  - `app/contact/page.tsx` — **MODIFY THIS FILE**: Current hardcoded emails, address, social links
  - `lib/site-settings-helpers.ts` (from T4) — `getPublicSettings()` function, `SETTING_DEFAULTS` map
  - `scripts/sql/027-site-settings.sql` (from T1) — Setting keys to use (contact_general_email, etc.)

  **Acceptance Criteria**:
  - [ ] No hardcoded email addresses in contact/page.tsx
  - [ ] No hardcoded office address in contact/page.tsx
  - [ ] Data fetched from getPublicSettings('contact') and getPublicSettings('social')
  - [ ] Fallback defaults work when DB is empty
  - [ ] Page renders identically to current version
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Verify hardcoded values removed
    Tool: Bash
    Steps:
      1. Read app/contact/page.tsx
      2. Search for "specskku@gmail.com" — expect 0 hardcoded matches (should come from DB/defaults)
      3. Search for "instagram.com/spec.skku" — expect 0 hardcoded matches
      4. Verify getPublicSettings calls exist
      5. Verify SETTING_DEFAULTS import for fallback
    Expected Result: All values come from DB with fallback, no hardcoded strings
    Evidence: .sisyphus/evidence/task-11-contact-refactor.txt

  Scenario: Verify build and fallback behavior
    Tool: Bash
    Steps:
      1. Run `npm run build` — expect success
      2. Verify SETTING_DEFAULTS includes all 8 settings with correct values
    Expected Result: Build passes, defaults ensure page never breaks
    Evidence: .sisyphus/evidence/task-11-build-fallback.txt
  ```

  **Commit**: YES
  - Message: `refactor(contact): read contact info from site_settings`
  - Files: `app/contact/page.tsx`

---

- [ ] 12. Refactor Footer: Read Social Links from site_settings

  **What to do**:
  - Modify `components/layout/Footer.tsx`:
    - Replace hardcoded Instagram and LinkedIn URLs with data from `site_settings` table.
    - Footer is likely a server component (or rendered within a server component). Use `getPublicSettings('social')` from `lib/site-settings-helpers.ts`.
    - If Footer is a client component, convert the social links section to accept props from the parent layout, or create a small server wrapper that fetches settings and passes them down.
    - Keep `SETTING_DEFAULTS` as fallback for social URLs.
    - Keep all other footer content (nav links, copyright) as-is.

  **Must NOT do**:
  - Do NOT change footer layout or design
  - Do NOT DB-ify the footer navigation links (programs, resources, company sections stay hardcoded)
  - Do NOT break the existing footer functionality

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Replace 2-3 URLs with DB-fetched values — minimal change
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T10, T11)
  - **Blocks**: None
  - **Blocked By**: T7 (site settings admin page)

  **References**:
  - `components/layout/Footer.tsx` — **MODIFY THIS FILE**: Find hardcoded Instagram/LinkedIn URLs
  - `lib/site-settings-helpers.ts` (from T4) — `getPublicSettings('social')`, `SETTING_DEFAULTS`
  - `app/admin/settings/SiteSettingsClient.tsx` (from T7) — Verify setting keys match

  **Acceptance Criteria**:
  - [ ] Hardcoded Instagram URL removed from Footer.tsx
  - [ ] Hardcoded LinkedIn URL removed from Footer.tsx
  - [ ] Social links fetched from site_settings with defaults fallback
  - [ ] Footer renders identically to current version
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Verify social URLs come from DB
    Tool: Bash
    Steps:
      1. Read components/layout/Footer.tsx
      2. Search for "instagram.com" — expect 0 hardcoded matches
      3. Search for "linkedin.com" — expect 0 hardcoded matches
      4. Verify getPublicSettings or equivalent call exists
      5. Run `npm run build`
    Expected Result: Social URLs dynamic, build passes
    Evidence: .sisyphus/evidence/task-12-footer-refactor.txt
  ```

  **Commit**: YES
  - Message: `refactor(footer): read social links from site_settings`
  - Files: `components/layout/Footer.tsx`

---

### PHASE 2 — BEFORE NEXT COHORT

#### Wave 4 — Foundation (3 parallel tasks)

- [ ] 13. Application Form Builder: Schema + Actions + Tests + Seed Data

  **What to do**:
  - Create `scripts/sql/029-application-form-fields.sql` with the `application_form_fields` table from Database Schema Designs section. Include RLS policies.
  - Create seed INSERT statements that replicate the current 6 hardcoded questions (mapping to correct field names):
    - Step 0: Basic info fields (name, student_id, email, phone, major, grade, enrollment_status) — these are structural, mark as `is_system: true` or handle separately
    - Step 1: Q1 (introduction: "왜 창업인가요?"), Q2 (vision: "지금까지 직접 해본 것들"), Q3 (startup_idea: "30주가 끝난 후")
    - Step 2: Q4 (portfolio_url → friday_participation: "매주 금요일 참여"), Q5 (experience_extra → team_role: "팀에서 본인은"), Q6 (additional_comments: "마지막으로 하고 싶은 말")
  - Create `lib/actions/form-fields.ts` with server actions:
    - `getFormFieldsByBatch(batch: string)` — Get all active fields for a batch, ordered by step_number + sort_order
    - `createFormField(data)` — Add a new question to a batch
    - `updateFormField(id, data)` — Update question text, validation rules, etc.
    - `deleteFormField(id)` — Soft delete (set is_active = false)
    - `duplicateFieldsForBatch(sourceBatch, targetBatch)` — Copy all fields from one batch to another (for new recruitment cycle)
    - `reorderFields(fieldIds: string[])` — Update sort_order based on array position
  - Create `__tests__/actions/form-fields.test.ts` with vitest tests.

  **Must NOT do**:
  - Do NOT modify the existing `applications` table schema
  - Do NOT fix the field name bugs (portfolio_url, experience_extra) — that's a separate migration
  - Do NOT add file upload field type

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex schema with batch-scoped fields, duplication logic, and validation rules
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T14, T15)
  - **Blocks**: T16 (form builder admin page), T19 (apply form update)
  - **Blocked By**: None

  **References**:
  - `app/apply/form/page.tsx` — Current 4-step form with 6 hardcoded questions (exact question text to seed)
  - `lib/actions/applications.ts` — Current field validation (min/max lengths, required flags)
  - `lib/actions/recruitment.ts` — Pattern reference for server actions
  - Database Schema Designs section — `application_form_fields` table SQL

  **Acceptance Criteria**:
  - [ ] Migration file creates table with all columns from schema
  - [ ] Seed data includes all 6 current questions with correct text, step numbers, validation rules
  - [ ] `duplicateFieldsForBatch` correctly copies fields between batches
  - [ ] Tests pass: `npx vitest run __tests__/actions/form-fields.test.ts`

  **QA Scenarios**:
  ```
  Scenario: Verify seed data matches current form questions
    Tool: Bash
    Steps:
      1. Read scripts/sql/029-application-form-fields.sql
      2. Count INSERT statements — expect 6 question rows (not counting basic info fields)
      3. Verify Q1 label contains "왜 창업인가요"
      4. Verify Q4 label contains "매주 금요일"
      5. Verify min_length/max_length match current validation (Q1-Q3: min 50, Q4: min 10, Q5: min 50, Q6: optional)
    Expected Result: Seed data is a 1:1 copy of current hardcoded questions
    Evidence: .sisyphus/evidence/task-13-seed-data.txt
  ```

  **Commit**: YES
  - Message: `feat(db): add application form fields table with seed data`
  - Files: `scripts/sql/029-application-form-fields.sql`, `lib/actions/form-fields.ts`, `__tests__/actions/form-fields.test.ts`

---

- [ ] 14. Curriculum Manager: Schema + Actions + Tests + Seed Data

  **What to do**:
  - Create `scripts/sql/030-curriculum-tables.sql` with `curriculum_weeks` and `curriculum_areas` tables from Database Schema Designs. Include RLS and triggers.
  - Create a seed script `scripts/sql/030-curriculum-seed.sql` that inserts all 30 learner weeks and 4 preneur areas from the current hardcoded data. Extract exact content from `app/curriculum/page.tsx`.
  - Create `lib/actions/curriculum.ts` with server actions:
    - `getCurriculumWeeks(track, batch?)` — Fetch weeks filtered by track and optional batch
    - `getCurriculumAreas(track, batch?)` — Fetch areas
    - `createWeek(data)` / `updateWeek(id, data)` / `deleteWeek(id)` — CRUD for weeks
    - `createArea(data)` / `updateArea(id, data)` / `deleteArea(id)` — CRUD for areas
    - `duplicateCurriculumForBatch(sourceBatch, targetBatch)` — Copy curriculum to new batch
  - Create `__tests__/actions/curriculum.test.ts`.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Standard CRUD with batch duplication — follows established patterns
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T13, T15)
  - **Blocks**: T17 (curriculum admin page), T20 (curriculum page update)
  - **Blocked By**: None

  **References**:
  - `app/curriculum/page.tsx` — **SOURCE DATA**: 30 learner weeks with week_number, topic, objectives, assignment, notes
  - `components/home/CurriculumRoadmap.tsx` — Preneur areas data (4 areas with title, subtitle, description, activities)
  - Database Schema Designs section — `curriculum_weeks` + `curriculum_areas` SQL

  **Acceptance Criteria**:
  - [ ] Both tables created with correct schemas
  - [ ] Seed data includes all 30 learner weeks + 4 preneur areas
  - [ ] `duplicateCurriculumForBatch` works correctly
  - [ ] Tests pass

  **QA Scenarios**:
  ```
  Scenario: Verify seed data completeness
    Tool: Bash
    Steps:
      1. Read scripts/sql/030-curriculum-seed.sql
      2. Count learner week INSERTs — expect 30
      3. Count preneur area INSERTs — expect 4
      4. Verify week 1 topic matches current data ("Kickoff" or equivalent)
    Expected Result: All curriculum content seeded correctly
    Evidence: .sisyphus/evidence/task-14-curriculum-seed.txt
  ```

  **Commit**: YES
  - Message: `feat(db): add curriculum tables with seed data`
  - Files: `scripts/sql/030-curriculum-tables.sql`, `scripts/sql/030-curriculum-seed.sql`, `lib/actions/curriculum.ts`, `__tests__/actions/curriculum.test.ts`

---

- [ ] 15. FAQ Manager: Schema + Actions + Tests + Seed Data

  **What to do**:
  - Create `scripts/sql/031-faq-tables.sql` with `faq_items` table from Database Schema Designs. Include RLS.
  - Create seed data INSERT statements for all 13 current FAQ items (3 sections × 4-5 items). Extract exact Q&A text from `app/demoday/faq/page.tsx`.
  - Create `lib/actions/faq.ts` with server actions:
    - `getAllFAQs()` — Fetch all active FAQ items grouped by section, ordered by sort_order
    - `getFAQsBySection(section)` — Fetch items for a specific section
    - `createFAQ(data)` / `updateFAQ(id, data)` / `deleteFAQ(id)` — CRUD
    - `reorderFAQs(itemIds: string[])` — Update sort_order
  - Create `__tests__/actions/faq.test.ts`.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Simple CRUD with section grouping — standard pattern
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T13, T14)
  - **Blocks**: T18 (FAQ admin page), T21 (FAQ page update)
  - **Blocked By**: None

  **References**:
  - `app/demoday/faq/page.tsx` — **SOURCE DATA**: 3 sections (the-basics, for-investors, for-founders) with Q&A pairs
  - Database Schema Designs section — `faq_items` SQL

  **Acceptance Criteria**:
  - [ ] Table created with correct schema
  - [ ] Seed data includes all 13 FAQ items with section, question, answer
  - [ ] Tests pass

  **QA Scenarios**:
  ```
  Scenario: Verify FAQ seed completeness
    Tool: Bash
    Steps:
      1. Read scripts/sql/031-faq-tables.sql
      2. Count INSERT statements — expect 13 FAQ items
      3. Verify 3 distinct section values exist
    Expected Result: All FAQ content seeded
    Evidence: .sisyphus/evidence/task-15-faq-seed.txt
  ```

  **Commit**: YES
  - Message: `feat(db): add FAQ table with seed data`
  - Files: `scripts/sql/031-faq-tables.sql`, `lib/actions/faq.ts`, `__tests__/actions/faq.test.ts`

---

#### Wave 5 — Admin Pages (3 parallel tasks, depend on Wave 4)

- [ ] 16. Application Form Builder Admin Page

  **What to do**:
  - Create `app/admin/form-builder/page.tsx` + `app/admin/form-builder/FormBuilderClient.tsx`.
  - UI: Show form fields grouped by step_number. Each field shows: label, field_type, required badge, min/max length.
  - Admin can: add new question, edit question text/validation, reorder within step, move between steps, delete (soft), duplicate fields to new batch.
  - Batch selector dropdown at top to switch between recruitment batches.
  - "다른 배치에서 복사" button to duplicate fields from another batch.
  - Preview panel showing how the form would look to applicants.
  - Follow SPEC design system, RecruitmentSettingsClient patterns.

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex interactive form builder with step management and preview
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with T17, T18)
  - **Blocks**: T19 (apply form DB integration)
  - **Blocked By**: T13 (form fields actions)

  **References**:
  - `lib/actions/form-fields.ts` (from T13) — All available actions
  - `app/admin/recruitment/RecruitmentSettingsClient.tsx` — UI patterns
  - `app/apply/form/page.tsx` — Current form layout (for preview reference)
  - AGENTS.md Design System

  **Acceptance Criteria**:
  - [ ] Form fields displayed grouped by step
  - [ ] CRUD operations work for all field properties
  - [ ] Batch duplication works
  - [ ] SPEC design system complied with
  - [ ] `npm run build` passes

  **Commit**: YES
  - Message: `feat(admin): add application form builder page`
  - Files: `app/admin/form-builder/page.tsx`, `app/admin/form-builder/FormBuilderClient.tsx`

---

- [ ] 17. Curriculum Manager Admin Page

  **What to do**:
  - Create `app/admin/curriculum/page.tsx` + `app/admin/curriculum/CurriculumClient.tsx`.
  - UI: Tab or toggle between tracks (Learner, Preneur). Learner shows week table (week_number, topic, objectives, assignment). Preneur shows area cards.
  - Admin can: add/edit/delete weeks and areas, reorder, duplicate for new batch.
  - Batch selector to manage different cohort curricula.
  - Follow SPEC design system.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Multi-tab admin page with table and card views
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with T16, T18)
  - **Blocks**: T20 (curriculum page update)
  - **Blocked By**: T14 (curriculum actions)

  **References**:
  - `lib/actions/curriculum.ts` (from T14)
  - `app/curriculum/page.tsx` — Current layout for reference
  - `app/admin/recruitment/RecruitmentSettingsClient.tsx` — UI patterns

  **Acceptance Criteria**:
  - [ ] Track switching (Learner/Preneur) works
  - [ ] CRUD on weeks and areas works
  - [ ] Batch selection/duplication works
  - [ ] `npm run build` passes

  **Commit**: YES
  - Message: `feat(admin): add curriculum manager page`
  - Files: `app/admin/curriculum/page.tsx`, `app/admin/curriculum/CurriculumClient.tsx`

---

- [ ] 18. FAQ Manager Admin Page

  **What to do**:
  - Create `app/admin/faq/page.tsx` + `app/admin/faq/FAQClient.tsx`.
  - UI: Show FAQ items grouped by section with collapsible section headers. Each item shows question (truncated) and edit/delete buttons.
  - Admin can: add new FAQ item (select section or create new section), edit Q&A, reorder, toggle active/inactive, delete.
  - Follow SPEC design system.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Grouped list UI with collapsible sections
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with T16, T17)
  - **Blocks**: T21 (FAQ page update)
  - **Blocked By**: T15 (FAQ actions)

  **References**:
  - `lib/actions/faq.ts` (from T15)
  - `app/demoday/faq/page.tsx` — Current FAQ layout
  - `app/admin/recruitment/RecruitmentSettingsClient.tsx` — Collapsible section pattern

  **Acceptance Criteria**:
  - [ ] FAQ items displayed grouped by section
  - [ ] CRUD operations work
  - [ ] `npm run build` passes

  **Commit**: YES
  - Message: `feat(admin): add FAQ manager page`
  - Files: `app/admin/faq/page.tsx`, `app/admin/faq/FAQClient.tsx`

---

#### Wave 6 — Public Page Updates (3 parallel tasks, depend on Wave 5)

- [ ] 19. Update /apply Form to Read Questions from Database

  **What to do**:
  - Modify `app/apply/form/page.tsx` to fetch form fields from DB using `getFormFieldsByBatch(currentBatch)` instead of hardcoded questions.
  - Keep the multi-step wizard structure but make steps dynamic based on `step_number` values from DB.
  - Keep Step 0 (basic info) and Step 3 (consent) hardcoded — they're structural, not content.
  - Steps 1-2 render dynamically from `application_form_fields` table.
  - Render appropriate input type based on `field_type` (text, textarea, select).
  - Apply validation rules from DB (required, min_length, max_length).
  - Fallback: if no fields in DB for current batch, show current hardcoded questions.
  - Update form submission to handle dynamic field names.

  **Must NOT do**:
  - Do NOT change the multi-step wizard UX
  - Do NOT modify the applications table schema
  - Do NOT change the consent step

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Dynamic form rendering with validation from DB — complex form logic
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 6 (with T20, T21)
  - **Blocks**: None
  - **Blocked By**: T16 (form builder admin page — ensures fields are manageable)

  **References**:
  - `app/apply/form/page.tsx` — **MODIFY THIS FILE**: Current 4-step form
  - `lib/actions/form-fields.ts` (from T13) — `getFormFieldsByBatch()` action
  - `lib/actions/applications.ts` — Current form submission handling

  **Acceptance Criteria**:
  - [ ] Steps 1-2 render from DB fields
  - [ ] Validation rules (required, min/max length) applied from DB
  - [ ] Fallback to hardcoded questions if DB is empty
  - [ ] Form submission still works correctly
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Verify dynamic form rendering
    Tool: Bash
    Steps:
      1. Read app/apply/form/page.tsx
      2. Verify getFormFieldsByBatch call exists
      3. Verify dynamic field rendering loop for steps 1-2
      4. Verify fallback logic for empty DB
      5. Run `npm run build`
    Expected Result: Form reads from DB with fallback, build passes
    Evidence: .sisyphus/evidence/task-19-dynamic-form.txt
  ```

  **Commit**: YES
  - Message: `refactor(apply): render form questions from database`
  - Files: `app/apply/form/page.tsx`

---

- [ ] 20. Update /curriculum Page to Read from Database

  **What to do**:
  - Modify `app/curriculum/page.tsx` to fetch learner weeks from `curriculum_weeks` table using `getCurriculumWeeks('learner')` (T14).
  - Replace the hardcoded `LEARNER_CURRICULUM` array with DB data.
  - Keep the 4-phase CurriculumRoadmap structure hardcoded (as decided).
  - Keep the preneur areas section — fetch from `getCurriculumAreas('preneur')`.
  - Fallback: if DB is empty, render empty state message "커리큘럼이 준비 중입니다."

  **Must NOT do**:
  - Do NOT change `components/home/CurriculumRoadmap.tsx` (4-phase structure stays hardcoded)
  - Do NOT change page design/layout

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Data source swap with same rendering — standard refactor
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 6 (with T19, T21)
  - **Blocks**: None
  - **Blocked By**: T17 (curriculum admin page)

  **References**:
  - `app/curriculum/page.tsx` — **MODIFY THIS FILE**: Current hardcoded arrays
  - `lib/actions/curriculum.ts` (from T14) — `getCurriculumWeeks()`, `getCurriculumAreas()`

  **Acceptance Criteria**:
  - [ ] Learner weeks fetched from DB
  - [ ] Preneur areas fetched from DB
  - [ ] CurriculumRoadmap unchanged
  - [ ] Empty state handled gracefully
  - [ ] `npm run build` passes

  **Commit**: YES
  - Message: `refactor(curriculum): render curriculum content from database`
  - Files: `app/curriculum/page.tsx`

---

- [ ] 21. Update /demoday/faq Page to Read from Database

  **What to do**:
  - Modify `app/demoday/faq/page.tsx` to fetch FAQ items from `faq_items` table using `getAllFAQs()` (T15).
  - Replace hardcoded FAQ sections/items array with DB data.
  - Group items by `section` field, use `section_title` for section headers.
  - Fallback: if DB is empty, show "FAQ가 준비 중입니다."

  **Must NOT do**:
  - Do NOT change the accordion/disclosure UI pattern
  - Do NOT change page design

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple data source swap — straightforward refactor
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 6 (with T19, T20)
  - **Blocks**: None
  - **Blocked By**: T18 (FAQ admin page)

  **References**:
  - `app/demoday/faq/page.tsx` — **MODIFY THIS FILE**
  - `lib/actions/faq.ts` (from T15) — `getAllFAQs()`

  **Acceptance Criteria**:
  - [ ] FAQ items fetched from DB grouped by section
  - [ ] Fallback for empty DB
  - [ ] `npm run build` passes

  **Commit**: YES
  - Message: `refactor(faq): render FAQ content from database`
  - Files: `app/demoday/faq/page.tsx`

---

### PHASE 3 — OPERATIONAL ENHANCEMENT

#### Wave 7 — Foundation + Pages (3 parallel tasks)

- [ ] 22. Partners Manager: Schema + Actions + Admin Page + Seed Data

  **What to do**:
  - Create `scripts/sql/032-partners.sql` with `partners` table from Database Schema Designs. Include RLS.
  - Seed with 3 current partners from `components/partners/Partners.tsx` (names, logo paths).
  - Create `lib/actions/partners.ts` with CRUD actions + `getActivePartners()`.
  - Create `app/admin/partners/page.tsx` + `PartnersClient.tsx` with table view, add/edit/delete, logo upload to Supabase Storage, sort order.
  - Add "파트너" to admin sidebar navigation.
  - Follow established admin page patterns.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Standard CRUD pattern with simple schema
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 7 (with T23, T24)
  - **Blocks**: T25 (partners component update)
  - **Blocked By**: None

  **References**:
  - `components/partners/Partners.tsx` — Current 3 partners data structure
  - `app/admin/recruitment/RecruitmentSettingsClient.tsx` — Admin page pattern
  - Database Schema Designs section — `partners` SQL

  **Acceptance Criteria**:
  - [ ] Partners table created with RLS
  - [ ] 3 partners seeded
  - [ ] Admin page with full CRUD
  - [ ] Logo upload works
  - [ ] `npm run build` passes

  **Commit**: YES
  - Message: `feat(admin): add partners manager with DB migration`
  - Files: `scripts/sql/032-partners.sql`, `lib/actions/partners.ts`, `app/admin/partners/page.tsx`, `app/admin/partners/PartnersClient.tsx`, `app/admin/AdminSidebar.tsx`, `app/admin/AdminNav.tsx`

---

- [ ] 23. Library Data Migration: Seed DB + Update Admin Page

  **What to do**:
  - Create a seed script `scripts/sql/034-library-seed.sql` that inserts all 30 items from `app/library/library-data.ts` into the existing `library_items` table. The table already exists (from `001-init.sql`) — just need to populate it.
  - Verify `library_items` table schema matches the data in `library-data.ts`. If columns are missing, create an ALTER migration.
  - Update `app/admin/library/LibraryClient.tsx` to use the DB table instead of imported data file (if it's currently importing from `library-data.ts`).
  - Update `app/library/page.tsx` and related pages to read from DB instead of `library-data.ts`.
  - Keep `library-data.ts` as a backup/reference but remove all imports of it.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Data migration + page updates — moderate complexity
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 7 (with T22, T24)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `app/library/library-data.ts` — Source data (30 items with 12+ fields)
  - `scripts/sql/001-init.sql` — Existing `library_items` table schema
  - `app/admin/library/LibraryClient.tsx` — Current admin page
  - `app/library/page.tsx` — Public library page

  **Acceptance Criteria**:
  - [ ] All 30 library items seeded to DB
  - [ ] Admin page reads from DB
  - [ ] Public library page reads from DB
  - [ ] No imports of `library-data.ts` remain in components
  - [ ] `npm run build` passes

  **Commit**: YES
  - Message: `feat(admin): migrate library data to DB and update admin page`
  - Files: `scripts/sql/034-library-seed.sql`, `app/library/page.tsx`, `app/admin/library/LibraryClient.tsx`

---

- [ ] 24. Audit Logging: Schema + Middleware Utility

  **What to do**:
  - Create `scripts/sql/033-audit-logs.sql` with `audit_logs` table from Database Schema Designs. Include indexes and RLS.
  - Create `lib/audit-log.ts` utility:
    - `logAdminAction(action: string, entityType: string, entityId: string, details?: object)` — Creates audit log entry. Gets current user from Supabase auth. Non-blocking (fire-and-forget, don't await).
    - Action types: 'create', 'update', 'delete', 'export', 'convert', 'link', 'unlink'
    - Entity types: 'member', 'setting', 'faq', 'curriculum', 'partner', 'form_field', 'application', 'homework'
  - Create `app/admin/audit/page.tsx` + `AuditLogClient.tsx`:
    - Show recent audit log entries in a table: timestamp, actor name, action, entity type, entity ID
    - Filter by entity_type, actor, date range
    - Paginated (50 per page)
  - Add "감사 로그" to admin sidebar.

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Cross-cutting middleware concern with fire-and-forget pattern
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 7 (with T22, T23)
  - **Blocks**: T27 (wiring audit into actions)
  - **Blocked By**: None

  **References**:
  - Database Schema Designs section — `audit_logs` SQL
  - `lib/actions/recruitment.ts` — Server action pattern to integrate logging into
  - `lib/supabase/server.ts` — Server client for getting current user

  **Acceptance Criteria**:
  - [ ] Audit logs table created with indexes and RLS
  - [ ] `logAdminAction` utility is fire-and-forget (non-blocking)
  - [ ] Admin page shows log entries with filters
  - [ ] `npm run build` passes

  **Commit**: YES
  - Message: `feat(admin): add audit logging schema and middleware`
  - Files: `scripts/sql/033-audit-logs.sql`, `lib/audit-log.ts`, `app/admin/audit/page.tsx`, `app/admin/audit/AuditLogClient.tsx`, `app/admin/AdminSidebar.tsx`, `app/admin/AdminNav.tsx`

---

#### Wave 8 — Integration (3 parallel tasks, depend on Wave 7)

- [ ] 25. Update Partners Component to Read from Database

  **What to do**:
  - Modify `components/partners/Partners.tsx` to fetch partners from DB using `getActivePartners()` (T22) instead of hardcoded array.
  - Partners component is rendered on the homepage — ensure server-side data fetching.
  - Fallback: if DB is empty, render nothing (no empty state — just hide the section).

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple data source swap in one component
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 8 (with T26, T27)
  - **Blocks**: None
  - **Blocked By**: T22 (partners manager)

  **References**:
  - `components/partners/Partners.tsx` — **MODIFY THIS FILE**
  - `lib/actions/partners.ts` (from T22) — `getActivePartners()`

  **Acceptance Criteria**:
  - [ ] Hardcoded partner data removed
  - [ ] Partners fetched from DB
  - [ ] Fallback: empty DB → section hidden
  - [ ] `npm run build` passes

  **Commit**: YES
  - Message: `refactor(partners): render partners from database`
  - Files: `components/partners/Partners.tsx`

---

- [ ] 26. Analytics Dashboard Enhancements + CSV Export

  **What to do**:
  - Enhance `app/admin/page.tsx` (dashboard) with additional analytics:
    - Application stats per batch: total, pending, under_review, accepted, rejected counts
    - Member counts by type: 러너, 프러너, alumni
    - Member counts by batch
  - Create `lib/actions/export.ts` with CSV export actions:
    - `exportMembersCSV(filters?)` — Already in T3, may just re-export from here
    - `exportApplicationsCSV(batch?)` — Export applications as CSV
  - Add CSV export buttons to dashboard and relevant admin pages.
  - Follow SPEC design system for dashboard cards.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Dashboard enhancement with aggregate queries and export logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 8 (with T25, T27)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `app/admin/page.tsx` — **MODIFY THIS FILE**: Current dashboard with runner count, attendance rate, homework rate
  - `lib/actions/members.ts` (from T3) — `exportMembersCSV()`
  - AGENTS.md Design System — Card styling

  **Acceptance Criteria**:
  - [ ] Dashboard shows application stats by batch
  - [ ] Dashboard shows member counts by type and batch
  - [ ] CSV export works for members and applications
  - [ ] `npm run build` passes

  **Commit**: YES
  - Message: `feat(admin): add analytics dashboard and CSV export`
  - Files: `app/admin/page.tsx`, `lib/actions/export.ts`

---

- [ ] 27. Wire Audit Logging into All Admin Server Actions

  **What to do**:
  - Add `logAdminAction()` calls to ALL existing admin server action files:
    - `lib/actions/members.ts` — log create, update, delete, link, unlink
    - `lib/actions/site-settings.ts` — log upsert
    - `lib/actions/member-conversion.ts` — log convert
    - `lib/actions/recruitment.ts` — log create, update, delete recruitment settings
    - `lib/actions/posts.ts` — log create, update, delete, toggle published
    - `lib/actions/admin.ts` — log role change
    - `lib/actions/applications.ts` — log status change, delete
    - `lib/actions/form-fields.ts` — log create, update, delete, duplicate
    - `lib/actions/curriculum.ts` — log create, update, delete, duplicate
    - `lib/actions/faq.ts` — log create, update, delete
    - `lib/actions/partners.ts` — log create, update, delete
  - Each `logAdminAction` call should be fire-and-forget (don't await, don't let logging failure block the action).
  - Place the log call AFTER the successful DB operation, not before.

  **Must NOT do**:
  - Do NOT await the logAdminAction call (fire-and-forget)
  - Do NOT let audit logging failure cause the main action to fail
  - Do NOT add logging to read-only actions (get/list/export)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Touching many files but with a mechanical, repetitive pattern
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 8 (with T25, T26)
  - **Blocks**: None
  - **Blocked By**: T24 (audit logging middleware)

  **References**:
  - `lib/audit-log.ts` (from T24) — `logAdminAction()` utility
  - ALL `lib/actions/*.ts` files — Add logging to each mutation function

  **Acceptance Criteria**:
  - [ ] All mutation actions across all action files have `logAdminAction` call
  - [ ] All calls are fire-and-forget (no await)
  - [ ] Logging placed after successful DB operation
  - [ ] No logging on read-only actions
  - [ ] `npm run build` passes
  - [ ] `npx vitest run` still passes (existing tests not broken)

  **Commit**: YES
  - Message: `feat(admin): wire audit logging into all admin server actions`
  - Files: `lib/actions/members.ts`, `lib/actions/site-settings.ts`, `lib/actions/member-conversion.ts`, `lib/actions/recruitment.ts`, `lib/actions/posts.ts`, `lib/actions/admin.ts`, `lib/actions/applications.ts`, `lib/actions/form-fields.ts`, `lib/actions/curriculum.ts`, `lib/actions/faq.ts`, `lib/actions/partners.ts`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in `.sisyphus/evidence/`. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npx tsc --noEmit` + `npm run lint` + `npx vitest run`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, `console.log` in prod, commented-out code, unused imports. Check SPEC design system compliance: correct hex colors, `font-['Pretendard',sans-serif]`, no emojis, lucide-react icons, correct spacing/radius tokens.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Design System [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration: create member → link profile → verify /people shows it. Test site settings → verify /contact and footer update. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (`git log`/`git diff`). Verify 1:1 — everything in spec was built, nothing beyond spec was built. Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

Each task produces ONE atomic commit. Commits should be made after task completion and QA pass.

| Task | Commit Message | Key Files |
|------|---------------|-----------|
| T1 | `chore(db): add site_settings table and homework due_date column` | `scripts/sql/027-*.sql`, `scripts/sql/028-*.sql` |
| T2 | `fix(admin): add hidden pages to sidebar and fix mobile nav` | `AdminSidebar.tsx`, `AdminNav.tsx` |
| T3 | `feat(admin): add member management server actions` | `lib/actions/members.ts`, `__tests__/actions/members.test.ts` |
| T4 | `feat(admin): add site settings server actions` | `lib/actions/site-settings.ts`, `__tests__/actions/site-settings.test.ts` |
| T5 | `feat(admin): add accepted-to-member conversion action` | `lib/actions/member-conversion.ts`, `__tests__/actions/member-conversion.test.ts` |
| T6 | `feat(admin): add members management page with full CRUD` | `app/admin/members/page.tsx`, `app/admin/members/MembersClient.tsx` |
| T7 | `feat(admin): add site settings management page` | `app/admin/settings/page.tsx`, `app/admin/settings/SiteSettingsClient.tsx` |
| T8 | `feat(admin): add member conversion UI to applications page` | `app/admin/applications/ApplicationsClient.tsx` |
| T9 | `feat(admin): add homework due_date editing and display` | `app/admin/homework/HomeworkClient.tsx`, `lib/actions/homework.ts` |
| T10 | `refactor(people): replace hardcoded photos and lead detection with DB` | `app/people/page.tsx` |
| T11 | `refactor(contact): read contact info from site_settings` | `app/contact/page.tsx` |
| T12 | `refactor(footer): read social links from site_settings` | `components/layout/Footer.tsx` |
| T13 | `feat(db): add application form fields table with seed data` | `scripts/sql/029-*.sql`, `lib/actions/form-fields.ts` |
| T14 | `feat(db): add curriculum tables with seed data` | `scripts/sql/030-*.sql`, `lib/actions/curriculum.ts` |
| T15 | `feat(db): add FAQ table with seed data` | `scripts/sql/031-*.sql`, `lib/actions/faq.ts` |
| T16 | `feat(admin): add application form builder page` | `app/admin/form-builder/page.tsx`, `FormBuilderClient.tsx` |
| T17 | `feat(admin): add curriculum manager page` | `app/admin/curriculum/page.tsx`, `CurriculumClient.tsx` |
| T18 | `feat(admin): add FAQ manager page` | `app/admin/faq/page.tsx`, `FAQClient.tsx` |
| T19 | `refactor(apply): render form questions from database` | `app/apply/form/page.tsx` |
| T20 | `refactor(curriculum): render curriculum content from database` | `app/curriculum/page.tsx` |
| T21 | `refactor(faq): render FAQ content from database` | `app/demoday/faq/page.tsx` |
| T22 | `feat(admin): add partners manager with DB migration` | `scripts/sql/032-*.sql`, `app/admin/partners/` |
| T23 | `feat(admin): migrate library data to DB and update admin page` | seed script, `app/admin/library/` |
| T24 | `feat(admin): add audit logging schema and middleware` | `scripts/sql/033-*.sql`, `lib/audit-log.ts` |
| T25 | `refactor(partners): render partners from database` | `components/partners/Partners.tsx` |
| T26 | `feat(admin): add analytics dashboard and CSV export` | `app/admin/page.tsx`, `lib/actions/export.ts` |
| T27 | `feat(admin): wire audit logging into all admin actions` | `lib/actions/*.ts` |

**Branch Strategy**: All work on a single feature branch `feature/admin-system-overhaul` from `dev`. Each wave = batch of commits. PR to `dev` after Phase 1 completion.

---

## Success Criteria

### Verification Commands
```bash
npm run build          # Expected: Build successful, zero errors
npx tsc --noEmit       # Expected: No type errors
npm run lint           # Expected: No lint errors
npx vitest run         # Expected: All tests pass
npx playwright test    # Expected: All e2e tests pass
```

### Final Checklist
- [ ] All "Must Have" items present and functional
- [ ] All "Must NOT Have" patterns absent from codebase
- [ ] All admin pages accessible from sidebar (zero hidden pages)
- [ ] Mobile admin nav has parity with desktop
- [ ] Members CRUD works: create, read, update, delete, search, filter, export
- [ ] Site settings editable and reflected on public pages
- [ ] /people page renders without any hardcoded data
- [ ] Contact page renders from site_settings
- [ ] Footer social links render from site_settings
- [ ] Accepted→member conversion creates correct member record
- [ ] Homework due_date shows "마감" badge when past due
- [ ] All new tables have proper RLS policies
- [ ] SPEC design system fully complied with (no forbidden patterns)
