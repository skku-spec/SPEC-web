# Click Latency Reduction & Immediate-Feedback UI

## Context

### Prior Optimizations (already shipped)
- `router.refresh()` removed across the app
- Auth state centralized in UserProvider (no per-component getUser())
- Middleware duplicate `getUser()` call removed
- Homepage below-fold sections code-split with `next/dynamic`
- Many forms already use `useTransition` + pending button text (17 files)

### Current Bottleneck Analysis

**Finding 1: ZERO `loading.tsx` files across 58 routes**
Every server-rendered navigation currently shows NO loading indicator until the full page is server-rendered and streamed. This is the single biggest source of perceived click latency.

**Finding 2: Five `force-dynamic` pages with heavy Supabase waterfalls**
- `app/blog/[slug]/page.tsx` — 2 sequential `Promise.all` blocks (post+related+tags, then comments+reactions)
- `app/u/[slug]/page.tsx` — `getPublicAuthorProfilePageData` + fallback Supabase query
- `app/apply/status/page.tsx`
- `app/jobs/location/[city]/page.tsx`
- `app/jobs/role/[role]/page.tsx`

**Finding 3: Server-rendered pages with multiple sequential Supabase fetches (no force-dynamic but no caching)**
- `app/people/[slug]/page.tsx` — 3 sequential Supabase queries (member → related members → profile lookup)
- `app/companies/[slug]/page.tsx` — 4 sequential Supabase queries (project → members+news+related → member details)
- `app/profile/page.tsx` — `requireAuth()` → then conditional `Promise.all([experiences, posts])`
- `app/founders/page.tsx` — multiple Supabase queries (auth + members + projects + member_projects)
- `app/admin/applications/[id]/page.tsx` — single Supabase query but behind admin layout auth check
- All 7 admin sub-pages hit Supabase in layout (role check) + page

**Finding 4: ZERO `<Suspense>` boundaries anywhere in the app**
No streaming SSR is used. Every page waits for ALL data before sending any HTML to the client.

**Finding 5: 13 `router.push`/`router.replace` calls with no transition feedback**
Programmatic navigations in forms (apply, signup, blog editor, logout, delete) provide no visual feedback during the navigation itself. Some forms use `useTransition` for the action but not for the subsequent navigation.

**Finding 6: No `prefetch={false}` on any Link**
Default Link prefetch is correct (good), but dynamic routes like `/blog/[slug]`, `/people/[slug]`, `/companies/[slug]` still have cold-start latency because their server component data can't be prefetched.

### Ranked Bottleneck Impact

| Rank | Bottleneck | Impact | Type |
|------|-----------|--------|------|
| 1 | Zero `loading.tsx` on dynamic routes | **Critical** — every navigation to any server-rendered page shows frozen UI | Perceived + Real |
| 2 | Sequential Supabase waterfalls on detail pages | **High** — `people/[slug]` and `companies/[slug]` have 3-4 sequential queries | Real |
| 3 | Blog post `force-dynamic` + 2-phase data fetch | **High** — always hits Supabase, then a second round for comments/reactions | Real |
| 4 | Zero Suspense streaming on profile/admin pages | **Medium** — user, experiences, posts all block the full page render | Real + Perceived |
| 5 | `router.push` navigations without transition feedback | **Medium** — 13 callsites with no spinner/disabled state during nav | Perceived |

---

## Work Objectives

1. Eliminate visible "frozen screen" on all high-traffic route navigations
2. Reduce real server response time on the heaviest dynamic pages
3. Add transition feedback on all programmatic navigations

## Guardrails

### Must Have
- All loading.tsx files render a skeleton matching the target page's layout
- All Supabase query parallelization must be verified by comparing waterfall before/after
- Existing `useTransition` patterns in forms must NOT be broken
- All changes must pass `tsc --noEmit` and `npm run build`
- Branch from `dev`, PR to `dev`

### Must NOT Have
- No new npm dependencies (skeleton UI is pure Tailwind)
- No state library changes
- No database schema changes
- No middleware changes
- No changes to authentication flow logic

---

## Task Dependency Graph

| Task | Depends On | Reason |
|------|------------|--------|
| Task 1: Route-level loading.tsx skeletons | None | Pure file additions, no existing code modified |
| Task 2: Supabase query parallelization | None | Refactors server-side data fetching only |
| Task 3: Blog post Suspense streaming | Task 1 | Needs loading.tsx pattern established first; wraps interactive section in Suspense |
| Task 4: Profile/admin Suspense streaming | Task 1 | Needs loading.tsx pattern; wraps heavy sections in Suspense |
| Task 5: Router.push transition feedback | None | Client-side only changes, independent of server-side work |
| Task 6: Verify + Integration test | Task 1, 2, 3, 4, 5 | Validates all changes work together |

## Parallel Execution Graph

```
Wave 1 (Start immediately — no dependencies):
├── Task 1: Route-level loading.tsx skeletons (14 files)
├── Task 2: Supabase query parallelization (2 files)
└── Task 5: Router.push transition feedback (9 files)

Wave 2 (After Wave 1 completes):
├── Task 3: Blog post Suspense streaming (1 file)
└── Task 4: Profile/admin Suspense streaming (2 files)

Wave 3 (After Wave 2 completes):
└── Task 6: Verify + Integration test

Critical Path: Task 1 → Task 3/4 → Task 6
Estimated Parallel Speedup: ~55% faster than sequential
```

---

## Tasks

### Task 1: Route-Level loading.tsx Skeleton Files

**Description**: Create `loading.tsx` files for the 14 highest-traffic route segments that currently show frozen UI during navigation.

**Files to create** (NEW files — no existing files modified):
1. `app/blog/[slug]/loading.tsx` — article skeleton (title bar, author row, content lines, sidebar)
2. `app/blog/loading.tsx` — blog list skeleton (grid of post cards)
3. `app/people/[slug]/loading.tsx` — member profile skeleton (photo + name + bio blocks)
4. `app/people/loading.tsx` — people grid skeleton
5. `app/companies/[slug]/loading.tsx` — company detail skeleton (logo + sidebar + sections)
6. `app/companies/loading.tsx` — company list skeleton
7. `app/u/[slug]/loading.tsx` — public profile skeleton (avatar + hero + sections)
8. `app/profile/loading.tsx` — profile page skeleton (card + settings)
9. `app/admin/loading.tsx` — admin dashboard skeleton
10. `app/dashboard/loading.tsx` — dashboard skeleton
11. `app/founders/loading.tsx` — founders grid skeleton
12. `app/apply/form/loading.tsx` — multi-step form skeleton
13. `app/library/[slug]/loading.tsx` — article detail skeleton
14. `app/library/loading.tsx` — library grid skeleton

**Each skeleton must**:
- Use Tailwind's `animate-pulse` with `bg-[#e8e6dc]` and `rounded` blocks
- Match the approximate layout of the target page (header height, card widths, sidebar width)
- Be a server component (no `"use client"`)
- Render in <50ms (pure HTML/CSS, no data fetching)

**Delegation Recommendation:**
- Category: `unspecified-low` — These are straightforward repetitive file creations following a clear pattern
- Skills: [`frontend-ui-ux`] — Need design awareness to match page layouts with skeleton shapes

**Skills Evaluation:**
- ✅ INCLUDED `frontend-ui-ux`: Skeletons must match real page structure to avoid jarring layout shift
- ❌ OMITTED `code-review`: No complex logic to review
- ❌ OMITTED `autopilot`: Simple, well-scoped task

**Depends On**: None
**Acceptance Criteria**:
- 14 new `loading.tsx` files exist in the listed paths
- Each file exports a default React component
- `npm run build` passes with zero errors
- Navigating to any of these routes shows a skeleton before content appears
- No `"use client"` directive in any loading.tsx file

---

### Task 2: Supabase Query Parallelization on Detail Pages

**Description**: Restructure sequential Supabase queries into parallel `Promise.all` calls on the two heaviest detail pages.

**Files to modify**:

1. **`app/people/[slug]/page.tsx`** (function `getPersonPageData`, lines 96-138):
   - Current: `supabase.from("members")...` → THEN `supabase.from("members")...` → THEN `getProfilesForDirectory`
   - Fix: First query to get the member (required for slug check). Then parallelize the related-members query AND profile lookup in one `Promise.all`.
   - Specific change: After getting `member` on line 101, combine lines 112-127 into:
     ```ts
     const [{ data: relatedMemberRows }, profileLookup] = await Promise.all([
       supabase.from("members").select(...)...,
       getProfilesForDirectory([member.public_profile_id, ...], [...]),
     ]);
     ```
   - **BUT**: `getProfilesForDirectory` needs the related member IDs which come from the related-members query. So instead: fetch related members first, THEN parallelize with a refactored `getProfilesForDirectory` call. Actually, the current code already fetches `relatedMemberRows` first and then calls `getProfilesForDirectory` with both. The real fix is to avoid the sequential nature by pre-fetching related members and the primary member in parallel:
     ```ts
     const [{ data: member }, { data: relatedMemberRows }] = await Promise.all([
       supabase.from("members").select(...).eq("slug", slug).eq("preneur_batch", "4기").maybeSingle(),
       supabase.from("members").select(...).eq("preneur_batch", "4기").neq("slug", slug).order("name", { ascending: true }).limit(4),
     ]);
     ```
   - This saves ~100-200ms by overlapping the two member queries.

2. **`app/companies/[slug]/page.tsx`** (function `getCompanyPageData`, lines 62-173):
   - Current: `supabase.from("projects")...` (line 67-71, blocks) → THEN `Promise.all` of 3 queries (already good) → THEN `supabase.from("members").select(...).in("id", memberIds)` (line 103-107, sequential after Promise.all)
   - The third query (`members` by IDs) depends on `member_projects` result, so it can't be parallelized further. However, we CAN fold it into the existing `Promise.all` by restructuring the query to join `member_projects` with `members` in a single query using Supabase's `.select("member_id, role, members!inner(id, name, linkedin_url)")`.
   - Alternatively, simpler: use the existing pattern but ensure the memberById map construction is not blocking.
   - **Best approach**: Replace the post-`Promise.all` member lookup with a Supabase join in the first `Promise.all`:
     ```ts
     const [{ data: memberJoinRows }, { data: projectNewsRows }, { data: relatedRows }] = await Promise.all([
       supabase
         .from("member_projects")
         .select("member_id, role, members(id, name, linkedin_url)")
         .eq("project_id", project.id),
       // ... rest unchanged
     ]);
     ```
   - This eliminates one sequential round-trip.

**Delegation Recommendation:**
- Category: `deep` — Requires careful analysis of data dependencies to avoid breaking the query logic
- Skills: [] — No special skills needed; this is pure server-side Supabase refactoring

**Skills Evaluation:**
- ❌ OMITTED `frontend-ui-ux`: No UI changes
- ❌ OMITTED `code-review`: Will be verified in Task 6
- ❌ OMITTED `autopilot`: Targeted change, not autonomous exploration

**Depends On**: None
**Acceptance Criteria**:
- `app/people/[slug]/page.tsx` uses a single `Promise.all` for member + related-members fetch
- `app/companies/[slug]/page.tsx` uses a joined `member_projects`→`members` query instead of sequential queries
- Both pages render identical output (same HTML structure, same data)
- `npm run build` passes
- No N+1 query patterns introduced

---

### Task 3: Blog Post Suspense Streaming for Comments/Reactions

**Description**: Split the blog post page into an above-fold static shell that streams immediately, and a below-fold interactive section (comments + reactions) that streams in via Suspense.

**Files to modify**:

1. **`app/blog/[slug]/page.tsx`** (lines 73-254):
   - Move the second `Promise.all` (comments + reactions, lines 104-113) OUT of the page function
   - Create an async server component `CommentsReactionsLoader` in the same file (or a new file `app/blog/[slug]/CommentsReactionsLoader.tsx`) that:
     - Takes `postId` and `userId` as props
     - Fetches comments and reactions itself
     - Renders `<InteractiveSection>`
   - Wrap `CommentsReactionsLoader` in `<Suspense fallback={<CommentsSkeleton />}>` in the page
   - The article header, content, tags, and related posts render immediately
   - Comments/reactions stream in when ready

   - Also: move `getCurrentUser()` (lines 86-94) into the Suspense boundary since it's only used for the interactive section's userId prop. This saves the auth round-trip from blocking the main article content.

**Delegation Recommendation:**
- Category: `unspecified-low` — Well-defined refactoring with clear before/after
- Skills: [`frontend-ui-ux`] — Skeleton design for comments section

**Skills Evaluation:**
- ✅ INCLUDED `frontend-ui-ux`: Need a matching skeleton for the comments/reactions area
- ❌ OMITTED `autopilot`: Targeted refactor

**Depends On**: Task 1 (loading.tsx pattern established)
**Acceptance Criteria**:
- Blog post article text, header, and image render without waiting for comments/reactions
- Comments/reactions section shows a skeleton, then streams in
- `getCurrentUser()` no longer blocks the main article render
- `npm run build` passes
- Interactive section functionality (comment posting, reactions) works identically

---

### Task 4: Profile & Admin Pages Suspense Streaming

**Description**: Add Suspense boundaries to the profile page and admin detail page to stream heavy sections independently.

**Files to modify**:

1. **`app/profile/page.tsx`** (lines 44-193):
   - The `PublicProfileEditor` + `OwnedPostsSection` (lines 169-189) depend on `experiences` and `ownedPosts` which require additional Supabase fetches
   - Create an async wrapper component that fetches experiences + posts and renders `PublicProfileEditor` + `OwnedPostsSection`
   - Wrap it in `<Suspense fallback={<ProfileEditorSkeleton />}>`
   - The main profile card (avatar, name, email, role, settings) renders immediately

2. **`app/admin/applications/[id]/page.tsx`** (lines 11-143):
   - This page is simpler (single query) but sits behind the admin layout auth check (`requireRole`)
   - Add `app/admin/applications/[id]/loading.tsx` (already covered in Task 1)
   - No Suspense needed here — the loading.tsx handles it

**Delegation Recommendation:**
- Category: `unspecified-low` — Straightforward Suspense wrapping following the pattern from Task 3
- Skills: [`frontend-ui-ux`] — Skeleton design for profile editor section

**Skills Evaluation:**
- ✅ INCLUDED `frontend-ui-ux`: Skeleton must match the public profile editor layout
- ❌ OMITTED `code-review`: Reviewed in Task 6

**Depends On**: Task 1 (loading.tsx pattern)
**Acceptance Criteria**:
- Profile page header card renders before experiences/posts/public-profile-editor load
- Suspense fallback skeleton is visible during the streaming gap
- All existing profile edit functionality works unchanged
- `npm run build` passes

---

### Task 5: Router.push Transition Feedback

**Description**: Add visual feedback (disabled state + spinner/pending text) to all 13 `router.push`/`router.replace` callsites so users see immediate response during programmatic navigation.

**Files to modify** (9 files, 13 callsites):

1. **`components/dashboard/DeleteApplicationButton.tsx`** — `router.push("/admin/applications")` after delete
   - Wrap the delete + navigate logic in `startTransition`; show "이동 중..." or disable the button

2. **`app/profile/LogoutButton.tsx`** — `router.push("/")` after logout
   - Already has logout logic; add pending state during navigation

3. **`app/blog/[slug]/PostAuthorActions.tsx`** — `router.push("/blog")` after delete
   - Add transition wrapper around post-delete navigation

4. **`components/Navbar.tsx`** — `router.push("/")` after logout
   - Add pending state to logout action in navbar

5. **`app/blog/PostEditorForm.tsx`** — `router.replace("/login")` (line 152) and `router.push(/blog/${slug})` (line 378)
   - The publish/save action already uses `useTransition` for the form action; extend the pending state to cover the navigation

6. **`app/signup/SignUpForm.tsx`** — `router.push("/login?registered=true")`
   - Already uses `useTransition`; ensure the pending state covers the navigation too

7. **`components/layout/Navbar.tsx`** — `router.push("/")` after logout
   - Same pattern as components/Navbar.tsx

8. **`app/apply/edit/page.tsx`** — 3 callsites: `router.push("/apply")` (lines 58, 172, 262)
   - Already uses `useTransition`; ensure navigation is wrapped

9. **`app/apply/form/page.tsx`** — 2 callsites: `router.push("/")` (line 189), `router.push("/apply")` (line 354)
   - Already uses `useTransition`; wrap navigation calls

**Pattern to apply** (for files NOT already using useTransition):
```tsx
const [isNavigating, startNavTransition] = useTransition();

// Replace: router.push("/path")
// With:
startNavTransition(() => {
  router.push("/path");
});

// In the button:
<button disabled={isNavigating}>
  {isNavigating ? "이동 중..." : "Original Text"}
</button>
```

For files ALREADY using `useTransition`, the `router.push` should be called inside the existing `startTransition` callback (after the server action completes) — which most already do. Verify and fix any cases where `router.push` is called OUTSIDE the transition.

**Delegation Recommendation:**
- Category: `quick` — Repetitive pattern application across multiple files
- Skills: [`frontend-ui-ux`] — Need to match existing button style patterns for disabled/pending states

**Skills Evaluation:**
- ✅ INCLUDED `frontend-ui-ux`: Pending state styling must match existing button conventions (colors, opacity patterns)
- ❌ OMITTED `autopilot`: Simple repetitive changes
- ❌ OMITTED `code-review`: Reviewed in Task 6

**Depends On**: None
**Acceptance Criteria**:
- All 13 `router.push`/`router.replace` callsites are wrapped in `startTransition` or inside an existing transition
- Buttons/UI elements that trigger navigation show a disabled/pending state
- No double-navigation bugs (button can't be clicked twice)
- `npm run build` passes
- Existing form submission flows (useTransition for server actions) are not broken

---

### Task 6: Verification & Integration Test

**Description**: Write tests for loading skeletons, verify build passes, and manually test the critical user flows.

**Tests to write** (TDD — tests first, but since Tasks 1-5 create the implementations, these tests validate):

1. **`__tests__/components/loading-skeletons.test.tsx`**:
   - Import each loading.tsx component
   - Verify it renders without errors (smoke test)
   - Verify it contains `animate-pulse` class (skeleton indicator)
   - Verify it does NOT fetch any data (no Supabase imports)

2. **`__tests__/components/router-transitions.test.tsx`**:
   - Mock `useRouter` and `useTransition`
   - Verify that components calling `router.push` use `startTransition`
   - Verify buttons show disabled state when `isPending` is true

**Manual verification steps** (critical user flows):
- [ ] Navigate from `/blog` to `/blog/[slug]` — skeleton appears, article loads, comments stream in
- [ ] Navigate from `/people` to `/people/[slug]` — skeleton appears, profile loads
- [ ] Navigate from `/companies` to `/companies/[slug]` — skeleton appears, detail loads
- [ ] Navigate to `/profile` — header card renders first, experiences stream in
- [ ] Submit the apply form — button shows pending, navigation occurs
- [ ] Logout from profile — button shows pending, redirects to home
- [ ] Admin navigate between pages — skeletons appear in layout
- [ ] `npm run build` passes with zero errors
- [ ] `npx tsc --noEmit` passes with zero errors

**Delegation Recommendation:**
- Category: `unspecified-low` — Test writing following existing test patterns
- Skills: [] — Standard vitest + React Testing Library

**Skills Evaluation:**
- ❌ OMITTED `frontend-ui-ux`: Tests, not UI
- ❌ OMITTED `code-review`: This IS the verification

**Depends On**: Tasks 1, 2, 3, 4, 5
**Acceptance Criteria**:
- All test files pass with `npx vitest run`
- `npm run build` passes
- `npx tsc --noEmit` passes
- All manual verification checkboxes above are confirmed

---

## Commit Strategy

Each task gets its own atomic commit for clean bisectability:

```
commit 1: feat: add route-level loading.tsx skeletons for 14 routes
  - All 14 loading.tsx files
  - MUST pass: npm run build

commit 2: perf: parallelize Supabase queries on people and company detail pages
  - app/people/[slug]/page.tsx
  - app/companies/[slug]/page.tsx
  - MUST pass: npm run build, pages render same data

commit 3: perf: add Suspense streaming to blog post comments/reactions
  - app/blog/[slug]/page.tsx (or split into CommentsReactionsLoader.tsx)
  - MUST pass: npm run build, blog post renders article immediately

commit 4: perf: add Suspense streaming to profile page editor section
  - app/profile/page.tsx
  - MUST pass: npm run build

commit 5: feat: add transition feedback to all router.push navigations
  - 9 files with router.push changes
  - MUST pass: npm run build

commit 6: test: add loading skeleton and router transition tests
  - __tests__/components/loading-skeletons.test.tsx
  - __tests__/components/router-transitions.test.tsx
  - MUST pass: npx vitest run
```

Branch name: `perf/click-latency-and-feedback-ui`
Base: `dev`
PR target: `dev`

---

## Success Criteria

1. **Every dynamic route navigation** shows a skeleton within 50ms of click (loading.tsx)
2. **Blog post page** renders article content without waiting for comments (~200-400ms faster)
3. **People detail page** loads ~100-200ms faster (parallel member queries)
4. **Companies detail page** loads ~100-150ms faster (joined query eliminates 1 round-trip)
5. **Profile page** shows header card instantly, streams editor section
6. **All 13 router.push callsites** show immediate visual feedback
7. **Zero regressions**: `tsc --noEmit`, `npm run build`, `vitest run` all pass
8. **Zero new dependencies** added to package.json

---

## TODO List (ADD THESE)

> CALLER: Add these TODOs using TodoWrite/TaskCreate and execute by wave.

### Wave 1 (Start Immediately — No Dependencies)

- [ ] **1. Route-level loading.tsx skeletons**
  - What: Create 14 `loading.tsx` files in the listed route directories. Each file exports a default server component with Tailwind `animate-pulse` skeleton matching target page layout. Use `bg-[#e8e6dc]` for skeleton blocks.
  - Depends: None
  - Blocks: Tasks 3, 4
  - Category: `unspecified-low`
  - Skills: [`frontend-ui-ux`]
  - QA: `npm run build` passes; all 14 files exist at listed paths; no `"use client"` in any loading.tsx

- [ ] **2. Supabase query parallelization**
  - What: In `app/people/[slug]/page.tsx` → refactor `getPersonPageData` to parallelize the primary member query and related-members query into a single `Promise.all`. In `app/companies/[slug]/page.tsx` → refactor `getCompanyPageData` to use a Supabase join on `member_projects` → `members` instead of the sequential post-query member lookup (eliminating one round-trip).
  - Depends: None
  - Blocks: Task 6
  - Category: `deep`
  - Skills: []
  - QA: `npm run build` passes; pages render identical data; no sequential Supabase calls remain where parallel is possible

- [ ] **5. Router.push transition feedback**
  - What: Add `useTransition` wrapping to all 13 `router.push`/`router.replace` callsites across 9 files. For files already using `useTransition`, ensure `router.push` is called INSIDE the transition callback. For files without `useTransition`, add it and wrap the navigation. Add disabled/pending visual state to the triggering button/link. Use existing pattern: `disabled={isPending}` + pending text.
  - Depends: None
  - Blocks: Task 6
  - Category: `quick`
  - Skills: [`frontend-ui-ux`]
  - QA: `npm run build` passes; all 13 callsites wrapped; buttons show pending state during navigation

### Wave 2 (After Wave 1 Completes)

- [ ] **3. Blog post Suspense streaming**
  - What: In `app/blog/[slug]/page.tsx`, extract comments+reactions fetching and `getCurrentUser()` into an async `CommentsReactionsLoader` server component. Wrap it in `<Suspense fallback={<CommentsSkeleton />}>`. The article header, body, tags, and related posts render immediately without waiting for comments/reactions/auth.
  - Depends: 1
  - Blocks: Task 6
  - Category: `unspecified-low`
  - Skills: [`frontend-ui-ux`]
  - QA: Blog post article visible before comments load; `npm run build` passes; comments/reactions still functional

- [ ] **4. Profile page Suspense streaming**
  - What: In `app/profile/page.tsx`, extract the `PublicProfileEditor` + `OwnedPostsSection` + their data fetching (experiences + ownedPosts) into an async wrapper component. Wrap in `<Suspense fallback={<ProfileEditorSkeleton />}>`. The main profile card (avatar, name, email, role, edit/logout buttons) renders immediately.
  - Depends: 1
  - Blocks: Task 6
  - Category: `unspecified-low`
  - Skills: [`frontend-ui-ux`]
  - QA: Profile header card visible before editor section loads; `npm run build` passes; profile editing still works

### Wave 3 (After Wave 2 Completes)

- [ ] **6. Verify + integration tests**
  - What: Write `__tests__/components/loading-skeletons.test.tsx` (smoke-test all 14 loading components, verify `animate-pulse` class, verify no Supabase imports). Write `__tests__/components/router-transitions.test.tsx` (mock useRouter/useTransition, verify transition wrapping). Run full `npm run build`, `tsc --noEmit`, `vitest run`. Execute manual verification checklist.
  - Depends: 1, 2, 3, 4, 5
  - Blocks: None
  - Category: `unspecified-low`
  - Skills: []
  - QA: `npx vitest run` passes all new tests; `npm run build` passes; `tsc --noEmit` passes; manual flow verification checklist complete

## Execution Instructions

1. **Wave 1**: Fire these tasks IN PARALLEL (no dependencies)
   ```
   task(category="unspecified-low", load_skills=["frontend-ui-ux"], run_in_background=false, prompt="Task 1: Create 14 loading.tsx skeleton files...")
   task(category="deep", load_skills=[], run_in_background=false, prompt="Task 2: Parallelize Supabase queries in people/[slug] and companies/[slug]...")
   task(category="quick", load_skills=["frontend-ui-ux"], run_in_background=false, prompt="Task 5: Add useTransition wrapping to all 13 router.push callsites...")
   ```

2. **Wave 2**: After Wave 1 completes, fire next wave IN PARALLEL
   ```
   task(category="unspecified-low", load_skills=["frontend-ui-ux"], run_in_background=false, prompt="Task 3: Extract blog comments/reactions into Suspense boundary...")
   task(category="unspecified-low", load_skills=["frontend-ui-ux"], run_in_background=false, prompt="Task 4: Extract profile page editor into Suspense boundary...")
   ```

3. **Wave 3**: After Wave 2, run final verification
   ```
   task(category="unspecified-low", load_skills=[], run_in_background=false, prompt="Task 6: Write loading skeleton + router transition tests, run full build + type check...")
   ```

4. **Final QA**: Verify all tasks pass their QA criteria, then create atomic commits following the commit strategy.
