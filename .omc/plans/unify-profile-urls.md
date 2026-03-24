# Unify Profile URLs Around `/profile/[slug]`

**Created:** 2026-03-24
**Status:** Ready for execution
**Branch:** `feature/unify-profile-urls` (from `dev`)

---

## Context

The app currently has three disconnected URL patterns for viewing a person's public profile:

| Current Route | Purpose | Backed by |
|---|---|---|
| `/u/[slug]` | Public author profile (the real page) | `profiles.slug` + `getPublicAuthorProfilePageData()` |
| `/people/[slug]` | Member directory detail (redirects to `/u/…` when public profile exists) | `members.slug` |
| `/profile` | Private self-profile (no link _to_ the public URL) | Auth + `profiles` row |

**Problems:**
1. `/u/` is opaque and not shareable as a "my profile" URL.
2. Member-directory cards link to `/u/{slug}` or `/people/{slug}` — inconsistent with the intended canonical.
3. The private `/profile` page doesn't surface a link to the user's own public profile.
4. `PublicProfileEditor` shows `/u/{slug}` as the public address.

**Goal:** Single canonical public profile at `/profile/[slug]`, with `/u/[slug]` permanently redirecting there. Member-directory links and blog author links all resolve to `/profile/[slug]`.

---

## Interpretation Validation

> The user wants: make a single canonical public profile route under `/profile/[slug]`, keep `/profile` private, keep `/profile/edit` private, redirect legacy `/u/[slug]` there, and make member-directory links use the same canonical route helper. Also surface the shareable public profile URL on the private `/profile` page.

**Assessment: Sound and minimal.** Here's why:

1. **No schema changes needed.** `profiles.slug` already exists. The change is purely routing + URL construction.
2. **Middleware safe.** Current `isProfileRoute()` protects `/profile` and `/profile/…` — but `/profile/[slug]` is a _public_ route, so the middleware must be tightened to protect only exact `/profile` and `/profile/edit`, not arbitrary `/profile/…` paths.
3. **No database migration.** Only file moves and string replacements.
4. **One critical edge case:** The middleware currently uses `pathname.startsWith("/profile/")` which would auth-gate the new public `/profile/[slug]` route. This MUST be fixed.

---

## Edge Cases to Preserve

| Edge Case | Current Behavior | Must Preserve |
|---|---|---|
| No public profile + member exists | `/u/[slug]` → redirect `/people/[slug]` | `/profile/[slug]` → redirect `/people/[slug]` |
| No public profile + no member | `/u/[slug]` → 404 | `/profile/[slug]` → 404 |
| Member has public profile | `/people/[slug]` → redirect `/u/[slug]` | `/people/[slug]` → redirect `/profile/[slug]` |
| Member has no public profile | `/people/[slug]` → stays, renders member page | Same — no change |
| Blog author link (public profile) | Links to `/u/[slug]` | Links to `/profile/[slug]` |
| Blog author link (no public profile) | No link rendered | Same — no change |
| Unauthenticated user visits `/profile` | Redirect to `/login` | Same — no change |
| Unauthenticated user visits `/profile/edit` | Redirect to `/login` | Same — no change |
| Unauthenticated user visits `/profile/[slug]` | N/A (new) | Public page, no auth |
| Authenticated user visits `/profile` | Shows own profile | Same + add link to public profile |
| Cache revalidation after save | Revalidates `/u/[slug]` | Must revalidate `/profile/[slug]` |
| SEO canonical | `alternates.canonical: /u/${slug}` | Must become `/profile/${slug}` |
| `PeoplePage` fallback href | `/u/${member.slug}` for members without public profile lookup | Must become `/profile/${member.slug}` |

---

## Work Objectives

Achieve a unified `/profile/[slug]` canonical URL for all public profile access with zero regressions in auth protection, member fallback chains, and cache revalidation.

---

## Guardrails

### Must Have
- `/profile` (exact) and `/profile/edit` remain auth-protected
- `/profile/[slug]` is publicly accessible (no auth required)
- `/u/[slug]` permanently redirects (308) to `/profile/[slug]`
- All existing fallback chains preserved (slug → member fallback → 404)
- Blog author links use new canonical
- Member directory links use new canonical
- Cache revalidation covers new paths
- SEO canonical URLs updated
- PublicProfileEditor shows `/profile/{slug}` as public address

### Must NOT Have
- No database/schema changes
- No changes to profile visibility logic or role-gating
- No changes to the actual profile page UI/content beyond URL references
- No breaking of `/profile/edit` functionality
- No removal of `/people/[slug]` route (it stays as-is with updated redirect target)

---

## Task Flow (6 steps)

### Step 1: Update `getPublicAuthorHref()` — The single source of truth

**Files:**
- `lib/public-profile.ts` — line 78: change `/u/${profile.slug}` → `/profile/${profile.slug}`

**What changes:**
```typescript
// Before (line 78)
return `/u/${profile.slug}`;

// After
return `/profile/${profile.slug}`;
```

**Acceptance Criteria:**
- `getPublicAuthorHref({ slug: "john", role: "preneur", profile_visibility: "public" })` returns `/profile/john`
- `getPublicAuthorHref(null)` still returns `null`
- `getPublicAuthorHref({ slug: "john", role: "preneur", profile_visibility: "private" })` still returns `null`

**Test:** Unit test in `__tests__/lib/public-profile.test.ts`

---

### Step 2: Fix middleware to allow public `/profile/[slug]` access

**Files:**
- `middleware.ts` — lines 25-27: tighten `isProfileRoute()` to only match _private_ profile routes

**What changes:**
```typescript
// Before (lines 25-27)
function isProfileRoute(pathname: string) {
  return pathname === "/profile" || pathname.startsWith("/profile/");
}

// After
function isProfileRoute(pathname: string) {
  return pathname === "/profile" || pathname === "/profile/edit";
}
```

**Why this is safe:** The only authenticated sub-routes under `/profile/` are `/profile` (exact) and `/profile/edit`. The new `/profile/[slug]` is public. There is no `/profile/settings` or other private sub-route.

**Acceptance Criteria:**
- `isProfileRoute("/profile")` → `true`
- `isProfileRoute("/profile/edit")` → `true`
- `isProfileRoute("/profile/john-doe")` → `false` (public — no auth gate)
- `isProfileRoute("/profile/edit/something")` → `false` (doesn't exist, harmless)

**Test:** Unit test in `__tests__/middleware.test.ts` for `isProfileRoute` behavior (extract function for testability if needed).

---

### Step 3: Create `/profile/[slug]` route + legacy `/u/[slug]` redirect

**Files:**
- `app/profile/[slug]/page.tsx` — **NEW FILE**: Move content from `app/u/[slug]/page.tsx` here
- `app/u/[slug]/page.tsx` — **REPLACE** with a permanent redirect to `/profile/[slug]`

**3a: `app/profile/[slug]/page.tsx`** (the canonical public profile page)

Copy `app/u/[slug]/page.tsx` contents to `app/profile/[slug]/page.tsx` with these changes:
- Line 33: `alternates: { canonical: `/profile/${slug}` }` (was `/u/${slug}`)
- No other content changes — same HeroSection, AboutSection, ExperienceSection, WritingSection
- Fallback logic preserved: no public profile + member exists → redirect `/people/${slug}`

**3b: `app/u/[slug]/page.tsx`** (legacy redirect)

Replace entire file with:
```typescript
import { redirect } from "next/navigation";

export default async function LegacyPublicAuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/profile/${slug}`);
}
```

Note: `redirect()` in Next.js App Router returns 307 by default. For a permanent redirect use `permanentRedirect()` from `next/navigation`.

**Acceptance Criteria:**
- `GET /profile/john-doe` renders public profile page (no auth required)
- `GET /u/john-doe` → 308 redirect to `/profile/john-doe`
- `GET /profile/john-doe` with non-existent profile + existing member → redirect `/people/john-doe`
- `GET /profile/john-doe` with non-existent profile + no member → 404
- SEO canonical is `/profile/john-doe`

**Test:** Smoke test that the page renders without errors (integration-level, can be deferred).

---

### Step 4: Update all hardcoded `/u/` URL strings

**Files and exact changes:**

| File | Line | Before | After |
|---|---|---|---|
| `app/people/page.tsx` | 124 | `` `/u/${member.slug}` `` | `` `/profile/${member.slug}` `` |
| `lib/actions/public-profile.ts` | 190 | `revalidatePath("/u/[slug]", "page")` | `revalidatePath("/profile/[slug]", "page")` |
| `lib/actions/public-profile.ts` | 191 | `` revalidatePath(`/u/${slug}`) `` | `` revalidatePath(`/profile/${slug}`) `` |
| `components/profile/PublicProfileEditor.tsx` | 317 | Text: `` `/u/{initial.slug}` `` | Text: `` `/profile/{initial.slug}` `` |
| `components/profile/PublicProfileEditor.tsx` | 347 | Display: `/u/{initial.slug}` | Display: `/profile/{initial.slug}` |
| `components/profile/PublicProfileEditor.tsx` | 386 | Text: `` `/u/[slug]` `` | Text: `` `/profile/[slug]` `` |
| `components/profile/PublicProfileEditor.tsx` | 440 | Text: `` `/u/[slug]` `` | Text: `` `/profile/[slug]` `` |

**Also add revalidation for legacy path** in `lib/actions/public-profile.ts`:
```typescript
function revalidatePublicProfilePaths(slug: string) {
  revalidatePath("/profile");
  revalidatePath("/blog");
  revalidatePath("/blog/[slug]", "page");
  revalidatePath("/people");
  revalidatePath("/people/[slug]", "page");
  revalidatePath("/profile/[slug]", "page");
  revalidatePath(`/profile/${slug}`);
}
```

**Acceptance Criteria:**
- No occurrence of `/u/` as a profile URL in the codebase (except legacy redirect file)
- `PeoplePage` fallback hrefs point to `/profile/{slug}`
- `PublicProfileEditor` displays `/profile/{slug}` as the public address
- Cache revalidation covers `/profile/[slug]` and `/profile/${slug}`
- Visibility description text says `/profile/[slug]` not `/u/[slug]`

**Test:** `grep -r '"/u/' --include='*.tsx' --include='*.ts' app/ lib/ components/` returns only `app/u/[slug]/page.tsx` (the redirect file).

---

### Step 5: Surface public profile link on private `/profile` page

**Files:**
- `app/profile/page.tsx` — Add a "View Public Profile" link below the profile card when the user has a public profile

**What changes:**

After the existing profile card section (around line 167, after `</section>`), add a conditional link:

```tsx
{profile?.slug && canEditPublicProfile && profile.profile_visibility === "public" && (
  <div className="mt-4 text-center">
    <Link
      href={`/profile/${profile.slug}`}
      className="inline-flex items-center gap-1.5 font-['Pretendard',sans-serif] text-[14px] font-medium text-[#FF6C0F] transition-opacity hover:opacity-70"
      target="_blank"
    >
      공개 프로필 보기 →
    </Link>
  </div>
)}
```

**Acceptance Criteria:**
- When user has `profile_visibility === "public"` and a slug: link appears pointing to `/profile/{slug}`
- When user has `profile_visibility === "private"`: link does NOT appear
- Link opens in new tab
- Link uses the canonical `/profile/{slug}` format

**Test:** Visual verification. Unit test optional (check conditional render based on profile state).

---

### Step 6: Verify build + type-check + no regressions

**Actions:**
1. `npx tsc --noEmit` — zero errors
2. `npm run lint` — zero errors
3. `npm run build` — succeeds
4. Manual smoke test:
   - Visit `/profile/[known-slug]` unauthenticated → public profile renders
   - Visit `/u/[known-slug]` → redirects to `/profile/[known-slug]`
   - Visit `/people` → cards link to `/profile/[slug]` for public profiles
   - Visit `/people/[slug]` for member with public profile → redirects to `/profile/[slug]`
   - Visit `/profile` authenticated → shows "View Public Profile" link
   - Visit `/profile` unauthenticated → redirects to `/login`
   - Visit `/profile/edit` unauthenticated → redirects to `/login`
   - Visit `/blog/[post-with-author]` → author link goes to `/profile/[slug]`

**Acceptance Criteria:**
- All CI checks pass (`lint`, `typecheck`, `build`)
- All existing e2e tests pass
- No 500 errors on any profile-related route

---

## Atomic Commit Strategy

| Commit # | Message | Files | Safe to deploy alone? |
|---|---|---|---|
| 1 | `test: add unit tests for getPublicAuthorHref and isProfileRoute` | `__tests__/lib/public-profile.test.ts`, `__tests__/middleware.test.ts` | Yes (tests only) |
| 2 | `refactor: change canonical profile URL from /u/ to /profile/ in helpers` | `lib/public-profile.ts` | No* (breaks `/u/[slug]` links until commit 3) |
| 3 | `feat: add /profile/[slug] public route and /u/[slug] redirect` | `app/profile/[slug]/page.tsx` (new), `app/u/[slug]/page.tsx` (replaced) | Yes with commit 2 |
| 4 | `fix: tighten middleware to allow public /profile/[slug] access` | `middleware.ts` | Yes with commits 2+3 |
| 5 | `refactor: update all /u/ references to /profile/ across codebase` | `app/people/page.tsx`, `lib/actions/public-profile.ts`, `components/profile/PublicProfileEditor.tsx` | Yes |
| 6 | `feat: surface public profile link on private /profile page` | `app/profile/page.tsx` | Yes |

**Recommended:** Squash commits 2-5 into a single commit for the PR to avoid any intermediate broken state. Keep commit 1 (tests) and commit 6 (feature addition) separate.

**Practical commit plan for PR:**
```
1. test: add unit tests for profile URL helpers and middleware route matching
2. feat: unify public profile URL under /profile/[slug] with /u/ redirect
3. feat: surface public profile link on private /profile page
```

---

## Ultrawork Parallelization Plan

These tasks can be parallelized for ultrawork execution:

**Wave 1 (parallel — no dependencies):**
- Worker A: Write unit tests (`__tests__/lib/public-profile.test.ts`)
- Worker B: Write middleware tests (`__tests__/middleware.test.ts`)

**Wave 2 (parallel — after wave 1 tests exist):**
- Worker C: Steps 1 + 2 (update `getPublicAuthorHref` + fix middleware)
- Worker D: Step 3 (create `/profile/[slug]` page + `/u/[slug]` redirect)

**Wave 3 (sequential — after wave 2):**
- Worker E: Step 4 (all hardcoded `/u/` string replacements)
- Worker F: Step 5 (surface link on `/profile` page)

**Wave 4 (sequential — final):**
- Verify: `tsc --noEmit && npm run lint && npm run build`

---

## Files Summary

| File | Action | Step |
|---|---|---|
| `lib/public-profile.ts` | Edit line 78 | 1 |
| `middleware.ts` | Edit lines 25-27 | 2 |
| `app/profile/[slug]/page.tsx` | **Create** (move from `app/u/[slug]/page.tsx`) | 3 |
| `app/u/[slug]/page.tsx` | **Replace** with redirect | 3 |
| `app/people/page.tsx` | Edit line 124 | 4 |
| `lib/actions/public-profile.ts` | Edit lines 190-191 | 4 |
| `components/profile/PublicProfileEditor.tsx` | Edit lines 317, 347, 386, 440 | 4 |
| `app/profile/page.tsx` | Add public profile link (~line 167) | 5 |
| `__tests__/lib/public-profile.test.ts` | **Create** (unit tests) | TDD |
| `__tests__/middleware.test.ts` | **Create** (unit tests) | TDD |

**Total: 8 existing files modified, 3 new files created**

---

## Success Criteria

1. `getPublicAuthorHref()` returns `/profile/{slug}` (not `/u/{slug}`)
2. `/profile/[slug]` renders the public profile page without authentication
3. `/u/[slug]` permanently redirects to `/profile/[slug]`
4. `/people/[slug]` redirects to `/profile/[slug]` (not `/u/[slug]`) for public profiles
5. `/profile` and `/profile/edit` remain auth-protected
6. Blog author links point to `/profile/[slug]`
7. `PublicProfileEditor` displays `/profile/{slug}` as the public address
8. Private `/profile` page shows "View Public Profile" link when profile is public
9. `npx tsc --noEmit` passes
10. `npm run lint` passes
11. `npm run build` succeeds
12. All existing tests pass
13. No hardcoded `/u/` profile URLs remain (except the redirect file)
