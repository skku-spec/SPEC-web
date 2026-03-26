# Code Review Remediation Plan

> **Generated:** 2026-03-26 | **Updated:** 2026-03-26 (post dev pull)
> **Source:** Full codebase code review (7 parallel agents) + dev branch resync
> **Scope:** 5 critical + 10 high + 4 medium findings + dead code cleanup
> **Execution Mode:** ultrawork (parallel waves with TDD)
> **Branch:** `fix/code-review-remediation` → `dev` → `main`
>
> ### Changes since initial plan (dev pull):
> - loading.tsx files: 23 → 37 (14 added by team). Loading state task removed.
> - Metadata pages: 22 → 36 (14 added by team). Remaining: 33 pages (18 admin + 15 public).
> - New page: `app/spec-log/[eventId]/[logId]/` — thread detail with OG metadata (properly implemented)
> - New migration: `20260327000001_add_anon_select_spec_log.sql` — anon SELECT on spec-log tables
> - New component: `components/ui/Toast.tsx` — toast notification system
> - New server action: `getLogById()` in spec-log.ts — **missing UUID validation** (added to W1-E scope)
> - Blog XSS vulnerability (`app/blog/[slug]/page.tsx:126-128`) still present — W1-A unchanged

---

## Table of Contents

1. [Architecture: Parallel Wave Structure](#1-parallel-wave-structure)
2. [Wave 0: Shared Infrastructure (sequential prerequisite)](#wave-0-shared-infrastructure)
3. [Wave 1: Critical Security Fixes](#wave-1-critical-security-fixes)
4. [Wave 2: High-Priority Security & Stability](#wave-2-high-priority-security--stability)
5. [Wave 3: High-Priority Code Quality & DX](#wave-3-high-priority-code-quality--dx)
6. [Wave 4: Medium Priority + Dead Code Cleanup](#wave-4-medium-priority--dead-code-cleanup)
7. [Atomic Commit Strategy](#atomic-commit-strategy)
8. [Verification Protocol](#verification-protocol)
9. [Risk Assessment](#risk-assessment)

---

## 1. Parallel Wave Structure

```
Wave 0 (sequential, ~15 min)
  └── Shared utilities: UUID validator, sanitizer helper, magic-byte validator
       │
       ├─── Wave 1 (parallel, ~45 min) ────── CRITICAL SECURITY ──────┐
       │    ├── W1-A: XSS + posts.ts UUID validation (C1+C5)          │
       │    ├── W1-B: Middleware + admin layout is_admin (C2)          │
       │    ├── W1-C: Admin race condition (C3)                        │
       │    ├── W1-D: tracker.ts error handling (C4)                   │
       │    └── W1-E: comments UUID validation (C5 partial)            │
       │                                                               │
       │         verify: tsc + build + unit tests ◄────────────────────┘
       │                                                               
       ├─── Wave 2 (parallel, ~40 min) ────── HIGH SECURITY ──────────┐
       │    ├── W2-A: Upload role check + magic bytes (H1+H2)          │
       │    ├── W2-C: Logout scope fix (H3)                            │
       │    ├── W2-D: Auth rate limiting (H4)                          │
       │    └── W2-E: View count rate limit + dedup (H5)               │
       │                                                               │
       │         verify: tsc + build + unit tests ◄────────────────────┘
       │                                                               
       ├─── Wave 3 (parallel, ~35 min) ────── HIGH QUALITY ───────────┐
       │    ├── W3-A: Padlet auth + SSRF (H8)                         │
       │    ├── W3-B: N+1 query optimization (H6)                      │
       │    ├── W3-C: Type casts cleanup (H7)                          │
       │    ├── W3-D: Admin page metadata (H9, H10)                    │
       │    └── W3-E: CSP header (M1)                                  │
       │                                                               │
       │         verify: tsc + build + unit tests ◄────────────────────┘
       │                                                               
       └─── Wave 4 (parallel, ~30 min) ────── CLEANUP ────────────────┐
            ├── W4-A: CSV formula injection (M2)                       │
            ├── W4-B: Design system colors (M3)                        │
            ├── W4-C: Error message language (M4)                      │
            └── W4-D: Dead code deletion (D1-D4)                      │
                                                                       │
                 verify: tsc + build + full test suite ◄───────────────┘
```

**Dependency Rules:**
- Wave 0 MUST complete before any Wave 1 task starts (shared utilities)
- Waves 1-4 are internally parallel (each lettered task is independent)
- Each wave must pass `tsc --noEmit` + `npm run build` before the next wave starts
- Wave 4 runs last because dead code deletion is lowest risk but touches many files

---

## Wave 0: Shared Infrastructure

> **Sequential prerequisite. Must complete first.**
> **Branch:** `fix/code-review-remediation` (created from `dev`)
> **Category:** `quick` | **Effort:** ~15 min

### W0-1: Create UUID validator utility

**File:** `lib/validators.ts` (NEW)

```typescript
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

export function requireUUID(value: string, paramName = "id"): string {
  if (!isValidUUID(value)) {
    throw new Error(`유효하지 않은 ${paramName} 형식입니다.`);
  }
  return value;
}
```

**Test file:** `__tests__/lib/validators.test.ts`
- Valid UUID v4 → returns true
- Invalid strings ("abc", "123", empty) → returns false
- SQL injection attempt → returns false
- requireUUID throws on invalid input

**QA Steps:**
1. `ls lib/validators.ts` → file exists
2. `npx tsc --noEmit` → exit code 0
3. `npm run test:unit -- validators` → all validator tests pass

### W0-2: Create DOMPurify sanitizer wrapper

**File:** `lib/sanitize.ts` (NEW)

```typescript
import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "h1","h2","h3","h4","h5","h6","p","br","hr","ul","ol","li",
  "a","strong","em","u","s","blockquote","pre","code",
  "img","figure","figcaption","table","thead","tbody","tr","th","td",
  "div","span","iframe"  // iframe for embeds, controlled by ALLOWED_ATTR
];

const ALLOWED_ATTR = [
  "href","target","rel","src","alt","width","height","class","id",
  "loading","decoding","style","colspan","rowspan",
  "allow","allowfullscreen","frameborder"  // iframe attrs
];

export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["target"],
  });
}
```

**Test file:** `__tests__/lib/sanitize.test.ts`
- Clean HTML passes through unchanged
- `<script>` tags are stripped
- `onclick` / `onerror` event handlers are stripped
- `<img src="x" onerror="alert(1)">` → only `<img src="x">`
- `<a href="javascript:alert(1)">` → href stripped
- Nested XSS vectors stripped
- Normal blog content (headings, paragraphs, images, links) preserved

**QA Steps:**
1. `ls lib/sanitize.ts` → file exists
2. `npx tsc --noEmit` → exit code 0
3. `npm run test:unit -- sanitize` → all sanitize tests pass

### W0-3: Create magic-byte validator utility

**File:** `lib/upload-validation.ts` (NEW)

```typescript
const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xFF, 0xD8, 0xFF]],
  "image/png":  [[0x89, 0x50, 0x4E, 0x47]],
  "image/gif":  [[0x47, 0x49, 0x46, 0x38]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]],  // RIFF header
  "image/avif": [],  // AVIF uses ftyp box — check bytes 4-8 for "ftyp"
};

export function validateMagicBytes(buffer: ArrayBuffer, declaredMime: string): boolean {
  const bytes = new Uint8Array(buffer.slice(0, 12));
  // ... validation logic
}
```

**Test file:** `__tests__/lib/upload-validation.test.ts`
- Real JPEG header bytes → true for image/jpeg
- Real PNG header bytes → true for image/png
- Mismatched (PNG bytes + jpeg mime) → false
- Empty buffer → false
- Text file with .jpg extension → false

**QA Steps:**
1. `ls lib/upload-validation.ts` → file exists
2. `npx tsc --noEmit` → exit code 0
3. `npm run test:unit -- upload-validation` → all upload-validation tests pass

### W0-4: Commit

```
fix: add shared security utilities (UUID validator, HTML sanitizer, magic-byte checker)
```

**Acceptance Criteria:**
- [ ] `npx tsc --noEmit` passes
- [ ] All 3 test files pass: `npm run test:unit -- --reporter=verbose validators sanitize upload-validation`
- [ ] No existing tests broken

---

## Wave 1: Critical Security Fixes

> **5 parallel tasks. All CRITICAL severity.**
> **Category for each task noted below.**

### W1-A: Stored XSS via Blog Content + posts.ts UUID Validation (C1 + C5 partial)

**Category:** `deep` | **Effort:** ~25 min | **Risk:** HIGH

**Files to modify:**
1. `app/blog/[slug]/page.tsx` — Sanitize on read
2. `lib/actions/posts.ts` — Sanitize on write (createPost, updatePost) + UUID validation on updatePost, deletePost, toggleFeatured, togglePublished

> **NOTE:** This task also handles UUID validation for posts.ts (originally W1-E) to avoid file collision in parallel execution. W1-E only handles comments.ts and spec-log-comments.ts.

**Changes:**

**`app/blog/[slug]/page.tsx` (line 126-128):**
```typescript
// BEFORE:
const sanitizedContent = (post.content ?? "")
  .replace(/<img(?![^>]*\bloading=)/gi, '<img loading="lazy"')
  .replace(/<img(?![^>]*\bdecoding=)/gi, '<img decoding="async"');

// AFTER:
import { sanitizeHTML } from "@/lib/sanitize";

const sanitizedContent = sanitizeHTML(post.content ?? "")
  .replace(/<img(?![^>]*\bloading=)/gi, '<img loading="lazy"')
  .replace(/<img(?![^>]*\bdecoding=)/gi, '<img decoding="async"');
```

**`lib/actions/posts.ts` — in `createPost()` and `updatePost()`:**
```typescript
import { sanitizeHTML } from "@/lib/sanitize";

// In createPost, before DB insert:
const cleanContent = sanitizeHTML(content);

// In updatePost, before DB update:
const cleanContent = sanitizeHTML(content);
```

**Test file:** `__tests__/lib/actions/posts-sanitize.test.ts`
- Blog post with `<script>` tag in content → script stripped on save
- Blog post with `onclick` handler → handler stripped on save
- Blog post with normal formatting → preserved
- Read path: `sanitizeHTML` called before dangerouslySetInnerHTML

**QA Steps:**
1. `grep -n 'sanitizeHTML' app/blog/\\[slug\\]/page.tsx lib/actions/posts.ts` → confirms sanitizer is imported and called in both read and write paths
2. `grep -n 'dangerouslySetInnerHTML' app/blog/\\[slug\\]/page.tsx` → verify it only receives `sanitizedContent` variable (which went through `sanitizeHTML`)
3. `npm run test:unit -- sanitize` → sanitize.test.ts passes (XSS vectors stripped, clean HTML preserved)
4. `npx tsc --noEmit` → exit code 0
5. `npm run build` → exit code 0

**Commit:** `fix(security): sanitize blog HTML + add UUID validation to posts.ts (C1, C5)`

**Acceptance Criteria:**
- [ ] `sanitizeHTML` called before `dangerouslySetInnerHTML` (grep verification)
- [ ] `sanitizeHTML` called in `createPost` and `updatePost` before DB insert/update (grep verification)
- [ ] `isValidUUID` called in `updatePost`, `deletePost`, `toggleFeatured`, `togglePublished`
- [ ] Sanitize test suite passes (XSS vectors stripped)
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes

---

### W1-B: Admin Gate — Middleware + Layout `is_admin` Check (C2)

**Category:** `quick` | **Effort:** ~20 min | **Risk:** MEDIUM

**Files to modify:**
1. `lib/auth.ts` — Add `requireAdmin()` helper that checks `(role === "preneur" || is_admin === true)`. This is the shared server-side auth path used by admin pages and server actions.
2. `middleware.ts` (line 125) — Use same OR logic in the middleware admin gate
3. `app/admin/layout.tsx` (line ~15) — Replace `requireRole("preneur")` with `requireAdmin()`
4. Any server actions that use `requireRole("preneur")` for admin-only checks — update to use `requireAdmin()` instead

> **NOTE:** The full admin gate surface includes: middleware → admin layout → shared auth helpers → server actions. Only fixing middleware/layout is insufficient because `lib/auth.ts:requireRole("preneur")` is called directly by server actions like `getApplicationStats()`, `export.ts`, etc. The fix must introduce a `requireAdmin()` helper in `lib/auth.ts` and update all admin-specific call sites.

**Change:**

The current `getUserRole` function only returns the role string. We need to also fetch `is_admin` from the profiles table.

```typescript
// BEFORE (line 125):
if (needsAdmin && role !== "preneur") {
  return redirectWithCookies(request, response, "/");
}

// AFTER:
// Option A (minimal change): Modify getUserRole to return { role, isAdmin }
// Then check:
if (needsAdmin && role !== "preneur" && !isAdmin) {
  return redirectWithCookies(request, response, "/");
}
```

**Implementation detail:** The `getUserRole()` function (defined earlier in middleware.ts) queries the profiles table. Modify it to `SELECT role, is_admin` and return both. Then destructure at the call site.

**Test file:** `__tests__/middleware-admin.test.ts`
- User with role=preneur → allowed through /admin/*
- User with role=learner + is_admin=true → allowed through /admin/*
- User with role=learner + is_admin=false → redirected to /
- User with role=alumni + is_admin=true → allowed through /admin/*
- Unauthenticated user → redirected to /

**QA Steps:**
1. `grep -n 'requireAdmin' lib/auth.ts` → confirms new `requireAdmin()` helper exists
2. `grep -n 'is_admin' lib/auth.ts` → confirms `is_admin` is checked in the helper
3. `grep -n 'requireAdmin' app/admin/layout.tsx` → confirms layout uses new helper
4. `grep -n 'is_admin' middleware.ts` → confirms middleware checks `is_admin`
5. `grep -rn 'requireRole.*preneur' lib/actions/ app/admin/` → verify admin-only call sites now use `requireAdmin()` instead
6. `npx tsc --noEmit` → exit code 0
7. `npm run build` → exit code 0

**Commit:** `fix(security): add requireAdmin() helper and update all admin gates (C2)`

**Acceptance Criteria:**
- [ ] `requireAdmin()` exists in `lib/auth.ts` and checks `(role === "preneur" || is_admin === true)`
- [ ] `app/admin/layout.tsx` uses `requireAdmin()` instead of `requireRole("preneur")`
- [ ] Middleware admin gate uses `is_admin` OR check
- [ ] Admin-only server actions use `requireAdmin()` where appropriate
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes

---

### W1-C: Race Condition in Admin Count Check (C3)

**Category:** `deep` | **Effort:** ~20 min | **Risk:** LOW (unlikely to occur, but severity is high)

**File to modify:** `lib/actions/admin.ts` (lines 131-142)

**Change:** Replace application-level count check with a database-level atomic check using a Supabase RPC function.

**New migration file:** `supabase/migrations/YYYYMMDDHHMMSS_prevent_last_admin_removal.sql`

```sql
CREATE OR REPLACE FUNCTION safe_remove_admin(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atomic single-statement approach: UPDATE only succeeds if at least
  -- 1 other admin exists. No separate SELECT/aggregate needed.
  UPDATE profiles
  SET is_admin = false
  WHERE id = target_user_id
    AND is_admin = true
    AND (SELECT count(*) FROM profiles WHERE is_admin = true AND id <> target_user_id) >= 1;

  IF NOT FOUND THEN
    -- Distinguish: was target the last admin, or not an admin at all?
    IF EXISTS (SELECT 1 FROM profiles WHERE id = target_user_id AND is_admin = true) THEN
      RAISE EXCEPTION 'Cannot remove the last admin';
    ELSE
      RAISE EXCEPTION 'User not found or not an admin';
    END IF;
  END IF;

  RETURN true;
END;
$$;
```

**In `lib/actions/admin.ts`:** Replace the count-then-update with:
```typescript
const { error } = await supabase.rpc("safe_remove_admin", { target_user_id: userId });
if (error) {
  if (error.message.includes("last admin")) {
    return { success: false, error: "마지막 관리자는 해제할 수 없습니다." };
  }
  return { success: false, error: error.message };
}
```

**Test file:** `__tests__/lib/actions/admin-race.test.ts`
- Mock: single admin → removal blocked with error message
- Mock: multiple admins → removal succeeds
- Verify RPC is called instead of count+update

**QA Steps:**
1. `ls supabase/migrations/*prevent_last_admin*` → migration file exists
2. `grep -n 'safe_remove_admin' lib/actions/admin.ts` → confirms RPC call replaces count+update
3. `grep -n 'SELECT COUNT' lib/actions/admin.ts` → must return zero results (old pattern removed)
4. `npx tsc --noEmit` → exit code 0
5. `npm run build` → exit code 0

**Commit:** `fix(security): use atomic DB function for last-admin protection (C3)`

**Acceptance Criteria:**
- [ ] Migration file created with `safe_remove_admin` function (ls verification)
- [ ] Application code uses `supabase.rpc("safe_remove_admin")` (grep verification)
- [ ] Old count+update pattern removed (grep returns empty)
- [ ] Error message is in Korean
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes

---

### W1-D: tracker.ts Error Handling Consistency (C4)

**Category:** `unspecified-low` | **Effort:** ~20 min | **Risk:** LOW

**File to modify:** `lib/actions/tracker.ts` (all 13 throw points across 285 lines)

**Change:** Wrap every exported function in try-catch, return `{ success, error?, data? }` instead of throwing.

**Pattern to apply to each function:**
```typescript
// BEFORE:
export async function getTrackerData() {
  // ...
  if (learnersError) throw new Error(`Failed to fetch learners: ${learnersError.message}`);
  // ...
  return { learners, sessions, homeworks, logs, submissions, assignments };
}

// AFTER:
export async function getTrackerData() {
  try {
    // ...
    if (learnersError) {
      return { success: false as const, error: `런너 목록을 불러오지 못했습니다: ${learnersError.message}` };
    }
    // ...
    return { success: true as const, data: { learners, sessions, homeworks, logs, submissions, assignments } };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다." };
  }
}
```

**All exported functions to update (actual exports per LSP symbols):**
- `getTrackerData()` — throws on learnersError, sessionsError, hwError, subsQuery error
- `markAttendance()` — throws on error
- `deleteAttendance()` — throws on error
- `toggleHomeworkSubmission()` — throws on error
- `toggleHomeworkStatusForUser()` — throws on error
- `syncHomeworkSubmissions()` — throws on error
- `createSession()` — throws on error
- `deleteSession()` — throws on error
- `markAllPresent()` — throws on error

**Also update callers** — grep `import.*from.*tracker` across `app/admin/` to find all call sites. Each caller must handle the new `{ success, data }` return shape.

**QA Steps:**
1. `grep -n 'throw ' lib/actions/tracker.ts` → must return zero results (no throw statements)
2. `grep -rn 'from.*tracker' app/ | grep -v node_modules` → list all callers; verify each handles `{ success, error }` pattern
3. `npx tsc --noEmit` → exit code 0 (callers must type-check with new return shape)
4. `npm run build` → exit code 0

**Commit:** `fix: standardize tracker.ts error handling to return result objects (C4)`

**Acceptance Criteria:**
- [ ] Zero `throw` statements in tracker.ts (grep verification)
- [ ] All 9 exported functions return `{ success, error? }` or `{ success, data }`
- [ ] All callers updated to handle new return format (tsc verifies)
- [ ] Error messages in Korean
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes

---

### W1-E: UUID Validation on ID Parameters (C5)

**Category:** `unspecified-low` | **Effort:** ~15 min | **Risk:** LOW

**Files to modify (posts.ts UUID work moved to W1-A to avoid file collision):**
1. `lib/actions/comments.ts` — **mutation functions only**: `createComment`, `deleteComment` (functions that take `commentId` or `postId` and return `ActionResult`)
2. `lib/actions/spec-log-comments.ts` — **mutation functions only**: `addLogComment(logId, parentId?)`, `deleteLogComment(commentId)`
3. `lib/actions/spec-log.ts` — `getLogById(logId)` — new function added in recent dev merge, takes `logId` without UUID validation. Returns `ActionResult` so can use standard validation pattern.

> **NOTE 1:** `posts.ts` UUID validation is handled by W1-A (same task modifies posts.ts for XSS). This avoids parallel file collision.
> **NOTE 2:** **Read functions returning arrays are EXCLUDED** from UUID validation error-object pattern. Functions like `getCommentsByPost()` return `CommentWithAuthor[]` (not `ActionResult`), and changing their return type would break all callers. For read functions, invalid UUIDs silently return empty results (Supabase `.eq("id", invalidUUID)` returns no rows).
> **NOTE 3:** `getLogById()` IS included because it returns `ActionResult<...>` — the standard error pattern works here.

**Change:** Add UUID validation at the start of each function that takes an ID parameter.

```typescript
import { isValidUUID } from "@/lib/validators";

// At start of function:
if (!isValidUUID(postId)) {
  return { success: false, error: "유효하지 않은 게시글 ID입니다." };
}
```

**QA Steps:**
1. `grep -n 'isValidUUID' lib/actions/comments.ts lib/actions/spec-log-comments.ts` → confirms validator is called in each target function
2. `npx tsc --noEmit` → exit code 0
3. `npm run build` → exit code 0

**Commit:** `fix(security): validate UUID format on all ID parameters (C5)`

**Acceptance Criteria:**
- [ ] All ID parameters validated before DB queries (grep verification)
- [ ] Invalid IDs return error without hitting database
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes

---

### Wave 1 Verification Gate

```bash
npx tsc --noEmit
npm run build
npm run test:unit
```

**All must pass before proceeding to Wave 2.**

---

## Wave 2: High-Priority Security & Stability

> **5 parallel tasks. All HIGH severity.**

### W2-A: Blog Image Upload — Role Check + Magic Byte Validation (H1 + H2)

**Category:** `quick` | **Effort:** ~15 min | **Risk:** LOW

> **NOTE:** W2-A and W2-B merged into one task because both modify `app/api/upload/blog-image/route.ts`. Prevents parallel file collision.

**Files to modify:**
1. `app/api/upload/blog-image/route.ts` — Add role check + magic byte validation
2. `app/api/upload/spec-log-image/route.ts` — Add magic byte validation only (role check already exists)

**File to modify (role check):** `app/api/upload/blog-image/route.ts` (after line 96)

**Change:** After authentication check, add role check matching spec-log pattern:

```typescript
import { BLOG_WRITER_ROLES } from "@/lib/auth-shared";

// After user auth check (line 96), add:
const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .single();

if (!profile || !BLOG_WRITER_ROLES.includes(profile.role)) {
  return NextResponse.json(
    { success: false, error: "블로그 이미지를 업로드할 권한이 없습니다." },
    { status: 403 }
  );
}
```

**Test file:** `__tests__/api/upload-blog-image.test.ts`
- Outsider role → 403
- Learner role → allowed
- Alumni role → allowed
- Preneur role → allowed
- Unauthenticated → 401

**QA Steps:**
1. `grep -n 'BLOG_WRITER_ROLES\|profile.role' app/api/upload/blog-image/route.ts` → confirms role check present
2. `grep -n '403' app/api/upload/blog-image/route.ts` → confirms 403 response exists
3. `grep -n 'validateMagicBytes' app/api/upload/blog-image/route.ts app/api/upload/spec-log-image/route.ts` → confirms magic byte validation in both files
4. `npm run test:unit -- upload-validation` → magic byte tests pass
5. `npx tsc --noEmit` → exit code 0
6. `npm run build` → exit code 0

**Commit:** `fix(security): add role check + magic byte validation to upload endpoints (H1, H2)`

**Acceptance Criteria:**
- [ ] `BLOG_WRITER_ROLES` imported and checked in blog-image route (grep verification)
- [ ] `validateMagicBytes` called in both upload routes (grep verification)
- [ ] Unauthorized roles get 403 with Korean error message
- [ ] Magic byte test suite passes
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes

---

### W2-C: Logout Scope Fix (H3)

**Category:** `quick` | **Effort:** ~5 min | **Risk:** LOW

**Files to modify:**
1. `components/Navbar.tsx` (line ~74) — `signOut()` → `signOut({ scope: "global" })`
2. `components/layout/Navbar.tsx` (line ~73) — same
3. `app/profile/LogoutButton.tsx` (line ~16) — verify current state (may already be correct)

**Change:**
```typescript
// BEFORE:
await supabase.auth.signOut();

// AFTER:
await supabase.auth.signOut({ scope: "global" });
```

**QA Steps:**
1. `grep -rn 'signOut(' components/ app/profile/` → every match must include `scope: "global"`
2. `grep -rn 'signOut()' components/ app/profile/` → must return zero results (no bare signOut calls)
3. `npx tsc --noEmit` → exit code 0

**Commit:** `fix(security): use global scope for logout to invalidate all sessions (H3)`

**Acceptance Criteria:**
- [ ] All 3 logout call sites use `scope: "global"`
- [ ] Zero bare `signOut()` calls remain (grep returns empty)
- [ ] `npx tsc --noEmit` passes

---

### W2-D: Rate Limiting on Auth Endpoints (H4)

**Category:** `unspecified-low` | **Effort:** ~15 min | **Risk:** LOW

**File to modify:** `lib/actions/auth.ts`

**Change:** Add rate limiting to signIn, signUp, forgotPassword using existing `lib/rate-limit.ts`:

```typescript
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

// At start of signIn():
const headerStore = await headers();
const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
const rl = rateLimit(`signIn:${ip}`, { maxRequests: 5, windowMs: 15 * 60 * 1000 });
if (!rl.allowed) {
  return { error: "너무 많은 로그인 시도입니다. 15분 후 다시 시도해주세요." };
}

// signUp: 3 requests per 15 min
// forgotPassword: 3 requests per 15 min
// resetPassword: 5 requests per 15 min
```

**Test file:** `__tests__/lib/actions/auth-ratelimit.test.ts`
- 5 signIn attempts → allowed
- 6th signIn attempt → rate limited with Korean message
- After window expires → allowed again
- Different IPs → independent limits

**QA Steps:**
1. `grep -n 'rateLimit' lib/actions/auth.ts` → confirms rateLimit called in signIn, signUp, forgotPassword
2. `grep -cn 'rateLimit(' lib/actions/auth.ts` → at least 3 matches (one per endpoint)
3. `npx tsc --noEmit` → exit code 0
4. `npm run build` → exit code 0

**Commit:** `fix(security): add rate limiting to auth endpoints (H4)`

**Acceptance Criteria:**
- [ ] `rateLimit` called in signIn, signUp, forgotPassword (grep verification, ≥3 calls)
- [ ] Error messages in Korean
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes

---

### W2-E: View Count Rate Limiting & Dedup (H5)

**Category:** `quick` | **Effort:** ~10 min | **Risk:** LOW

**File to modify:** `lib/actions/views.ts`

**Change:** Add IP-based dedup and rate limiting:

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";
import { isValidUUID } from "@/lib/validators";

export async function incrementViewCount(postId: string): Promise<void> {
  if (!isValidUUID(postId)) return; // Silent fail for invalid IDs

  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // Dedup: 1 view per IP per post per hour
  const rl = rateLimit(`view:${postId}:${ip}`, { maxRequests: 1, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) return; // Silent dedup

  const supabase = await createClient();
  await supabase.rpc("increment_post_view_count", { post_id: postId });
}
```

**Test file:** `__tests__/lib/actions/views-ratelimit.test.ts`
- First view from IP → increments
- Second view from same IP within 1 hour → no-op
- View from different IP → increments
- Invalid UUID → no DB call

**QA Steps:**
1. `grep -n 'rateLimit\|isValidUUID' lib/actions/views.ts` → confirms both dedup and UUID validation present
2. `npx tsc --noEmit` → exit code 0
3. `npm run build` → exit code 0

**Commit:** `fix(security): add IP-based dedup and rate limiting to view count (H5)`

**Acceptance Criteria:**
- [ ] `rateLimit` and `isValidUUID` both called (grep verification)
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` passes

---

### Wave 2 Verification Gate

```bash
npx tsc --noEmit
npm run build
npm run test:unit
```

---

## Wave 3: High-Priority Code Quality & DX

> **5 parallel tasks. HIGH severity (quality/DX focus).**

### W3-A: Padlet API — Auth + SSRF Protection (H8)

**Category:** `quick` | **Effort:** ~10 min | **Risk:** LOW

**File to modify:** `app/api/padlet/board/route.ts`

**Changes:**
1. Add authentication check
2. Add regex validation on board_id (alphanumeric only)
3. Add rate limiting

```typescript
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  // Rate limit
  const rl = rateLimit(`padlet:${user.id}`, { maxRequests: 10, windowMs: 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "요청이 너무 많습니다." }, { status: 429 });
  }

  let boardId = req.nextUrl.searchParams.get("board_id");
  // ... existing extraction logic ...

  // SSRF protection: board_id must be alphanumeric (Padlet IDs are numeric)
  if (!/^[a-zA-Z0-9_-]+$/.test(boardId)) {
    return NextResponse.json({ error: "잘못된 board_id입니다." }, { status: 400 });
  }
  // ... rest of handler
}
```

**Test file:** `__tests__/api/padlet-board.test.ts`
- Unauthenticated → 401
- Valid board_id → passes through
- Board ID with path traversal (`../../etc/passwd`) → 400
- Board ID with URL (`http://internal-host`) → 400

**QA Steps:**
1. `grep -n 'getUser\|auth' app/api/padlet/board/route.ts` → confirms auth check present
2. `grep -n 'rateLimit' app/api/padlet/board/route.ts` → confirms rate limiting present
3. `grep -n 'test.*boardId\|regex\|alphanumeric' app/api/padlet/board/route.ts` → confirms input validation present
4. `npx tsc --noEmit` → exit code 0
5. `npm run build` → exit code 0

**Commit:** `fix(security): add auth, rate limit, and SSRF protection to Padlet proxy (H8)`

---

### W3-B: N+1 Query Optimization in getEventsByBatch (H6)

**Category:** `unspecified-low` | **Effort:** ~15 min | **Risk:** MEDIUM

**File to modify:** `lib/actions/spec-log.ts` (lines 178-282)

**Investigation update:** The explore agent found this is actually 3 batched queries (not N+1). However, it can still be optimized with Supabase nested selects to reduce to 1-2 queries.

**Change:** Use Supabase relation-based `.select()` with nested joins:

```typescript
// BEFORE: 3 separate queries
// Query 1: events by batch
// Query 2: logs by event IDs
// Query 3: profiles by IDs

// AFTER: 1 query with nested select
const { data: events } = await supabase
  .from("spec_events")
  .select(`
    *,
    spec_logs (
      *,
      profiles:user_id (id, name, username, role, photo_url),
      spec_log_images (*),
      spec_log_comments (count),
      spec_log_reactions (count)
    )
  `)
  .eq("batch", batch)
  .order("date", { ascending: false });
```

**Note:** If the nested select approach doesn't match the exact data shape expected downstream, fall back to keeping the 3 batched queries (which are already acceptable — not a true N+1). Only optimize if it simplifies code.

**QA Steps:**
1. `npx tsc --noEmit` → exit code 0 (type safety of new query shape)
2. `npm run build` → exit code 0
3. Grep callers of `getEventsByBatch`: verify return type interface is unchanged. If the nested select returns a different shape, map it to the original shape before returning.
4. Run existing spec-log tests: `npm run test:unit -- spec-log` → pass

**Commit:** `perf: optimize getEventsByBatch with nested Supabase select (H6)`

**Acceptance Criteria:**
- [ ] Query count reduced (or maintained at 3 if nested joins don't fit)
- [ ] Return type interface unchanged (same fields, same nesting)
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes
- [ ] Existing spec-log tests pass

---

### W3-C: Remove `as never` Type Casts (H7)

**Category:** `quick` | **Effort:** ~15 min | **Risk:** LOW

**Files to modify:**
1. `lib/supabase/types.ts` — Add missing table type declarations
2. `lib/actions/site-settings.ts` — Remove `as never`
3. `lib/actions/partners.ts` — Remove `as never`
4. `lib/actions/faq.ts` — Remove `as never`
5. `lib/actions/form-builder.ts` — Remove `as never`
6. `lib/actions/curriculum.ts` — Remove `as never`

**Change:** Add manual type declarations to `types.ts` for the 6 missing tables:

```typescript
// In types.ts, extend the Database type or add a module augmentation:
// Add interfaces for: site_settings, partners, faq_items,
// application_form_fields, curriculum_weeks, curriculum_areas

// Then in each action file, replace:
type TableName = never;
const TABLE = "site_settings" as TableName;

// With:
// Direct usage without cast — types now exist
```

**Approach options:**
1. **Best:** Run `npx supabase gen types typescript` to regenerate types from live schema
2. **Fallback:** Manually declare the 6 table interfaces based on actual usage in the action files

**QA Steps:**
1. `grep -rn 'as never' lib/actions/site-settings.ts lib/actions/partners.ts lib/actions/faq.ts lib/actions/form-builder.ts lib/actions/curriculum.ts` → must return zero results
2. `grep -rn 'type TableName = never' lib/actions/` → must return zero results
3. `npx tsc --noEmit` → exit code 0 (proves types are correct)
4. `npm run build` → exit code 0

**Commit:** `fix(types): add missing table types and remove 'as never' casts (H7)`

**Acceptance Criteria:**
- [ ] Zero `as never` casts in the 5 action files (grep verification)
- [ ] Zero `type TableName = never` declarations (grep verification)
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes

---

### W3-D: Admin Page Metadata + H1 Color Fixes (H9, H10)

**Category:** `quick` | **Effort:** ~20 min | **Risk:** LOW

**Files to modify:** All 17+ admin page.tsx files under `app/admin/`

**Change:** Add `export const metadata` to each:

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "사용자 관리 | SPEC Admin",
  description: "SPEC 회원 관리 페이지",
};
```

**Admin page metadata mapping:**

| Path | Title |
|------|-------|
| /admin | 대시보드 \| SPEC Admin |
| /admin/users | 사용자 관리 \| SPEC Admin |
| /admin/spec-log | SPEC Log 관리 \| SPEC Admin |
| /admin/homework | 과제 관리 \| SPEC Admin |
| /admin/attendance | 출석 관리 \| SPEC Admin |
| /admin/tags | 태그 관리 \| SPEC Admin |
| /admin/applications | 지원서 관리 \| SPEC Admin |
| /admin/applications/[id] | 지원서 상세 \| SPEC Admin |
| /admin/partners | 파트너 관리 \| SPEC Admin |
| /admin/form-builder | 지원 양식 관리 \| SPEC Admin |
| /admin/faq | FAQ 관리 \| SPEC Admin |
| /admin/curriculum | 커리큘럼 관리 \| SPEC Admin |
| /admin/audit | 감사 로그 \| SPEC Admin |
| /admin/settings | 설정 \| SPEC Admin |
| /admin/members | 멤버 관리 \| SPEC Admin |
| /admin/recruitment | 모집 관리 \| SPEC Admin |
| /admin/posts | 게시글 관리 \| SPEC Admin |
| /admin/posts/new | 새 게시글 \| SPEC Admin |

**Also add metadata to 15 public pages still missing it:**
- `app/apply/edit`, `app/apply/form`, `app/apply/status`, `app/apply/submitted`
- `app/blog/page.tsx`, `app/blog/write`, `app/blog/edit/[slug]`
- `app/companies/page.tsx`, `app/curriculum/page.tsx`, `app/founders/page.tsx`
- `app/design-system/page.tsx`, `app/faq/page.tsx`
- `app/u/[slug]`, `app/verify/page.tsx`, `app/cofounder-matching/page.tsx`

**QA Steps:**
1. `grep -rn 'export const metadata' app/admin/ | wc -l` → count ≥ 18 (all admin page.tsx files)
2. `grep -rn 'export const metadata' app/admin/ | grep -v 'SPEC Admin'` → must return zero (all titles have suffix)
3. `npx tsc --noEmit` → exit code 0
4. `npm run build` → exit code 0 (metadata must not conflict with `"use client"` — metadata goes in server page.tsx only)

**Commit:** `feat(seo): add metadata to all admin and public pages (H9, H10)`

**Acceptance Criteria:**
- [ ] ≥17 admin page.tsx files have `export const metadata` (grep count verification)
- [ ] All titles include " | SPEC Admin" suffix (grep verification)
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes

---

### W3-E: Content-Security-Policy Header (M1)

**Category:** `quick` | **Effort:** ~10 min | **Risk:** MEDIUM (may break inline styles/scripts)

**File to modify:** `next.config.ts`

**Change:** Add CSP to existing security headers:

```typescript
{
  key: "Content-Security-Policy",
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // Next.js requires unsafe-inline/eval
    "style-src 'self' 'unsafe-inline'",  // Tailwind inline styles
    "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in",
    "font-src 'self' https://cdn.jsdelivr.net",  // If Pretendard is loaded from CDN
    "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co",
    "frame-src 'self' https://padlet.com https://*.padlet.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
}
```

**CRITICAL: Test thoroughly** — CSP can break:
- Supabase realtime WebSocket connections
- Image uploads/previews
- Padlet iframe embeds
- Font loading

**QA Steps:**
1. `npm run build` → exit code 0
2. `grep -n "Content-Security-Policy" next.config.ts` → confirms header exists
3. `npx tsc --noEmit` → exit code 0
4. After deploy to Vercel preview: `curl -sI https://<preview-url> | grep -i content-security-policy` → header present in response
5. If CSP causes console errors in browser (visible via Playwright or manual check), widen the directive. Rollback criteria: if any core page breaks, revert this commit independently.

**Commit:** `fix(security): add Content-Security-Policy header (M1)`

**Acceptance Criteria:**
- [ ] CSP header string present in `next.config.ts` headers array
- [ ] `npm run build` passes (no config errors)
- [ ] `npx tsc --noEmit` passes
- [ ] Rollback plan: single `git revert` of this commit if CSP breaks production

---

### Wave 3 Verification Gate

```bash
npx tsc --noEmit
npm run build
npm run test:unit
```

---

## Wave 4: Medium Priority + Dead Code Cleanup

> **4 parallel tasks. MEDIUM severity + cleanup.**

### W4-A: CSV Formula Injection Fix (M2)

**Category:** `quick` | **Effort:** ~10 min | **Risk:** LOW

**Files to modify:**
1. `lib/actions/export.ts` — `escapeCSV()` already wraps in quotes (SAFE)
2. `lib/actions/members.ts` — `escapeCSVField()` needs formula prefix protection

**Change in `lib/actions/members.ts`:**

```typescript
function escapeCSVField(value: string): string {
  let str = (value ?? "").toString();
  // Formula injection protection
  if (/^[=+@\-]/.test(str)) {
    str = "'" + str;
  }
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("'")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
```

**Test file:** `__tests__/lib/actions/csv-injection.test.ts`
- `=CMD()` → `'=CMD()` (prefixed)
- `+1234` → `'+1234` (prefixed)
- `@SUM()` → `'@SUM()` (prefixed)
- `-1+1` → `'-1+1` (prefixed)
- Normal text → unchanged

**QA Steps:**
1. `grep -n "^[=+@-]" lib/actions/members.ts` → verify the regex pattern is present in escapeCSVField
2. `npx tsc --noEmit` → exit code 0
3. `npm run build` → exit code 0

**Commit:** `fix(security): protect CSV export from formula injection (M2)`

---

### W4-B: Design System Color Violations (M3)

**Category:** `visual-engineering` | **Effort:** ~10 min | **Risk:** LOW

**Files to modify:**
1. `components/profile/ProfileEditForm.tsx`
2. `components/dashboard/DeleteApplicationButton.tsx`

**Color replacements:**

| File | From | To | Reason |
|------|------|----|--------|
| ProfileEditForm | `#ccc` | `#ddd9cc` | border-default |
| ProfileEditForm | `#fff4e9` | `#FFF0E5` | badge-orange-bg |
| ProfileEditForm | `#b64a00` | `#FF6C0F` | primary orange |
| ProfileEditForm | `#fdecec` | `#FEE2E2` | badge-red-bg |
| ProfileEditForm | `#d7d5ca` | `#ddd9cc` | border-default |
| ProfileEditForm | `shadow-[...]` | (remove) | No shadows on cards |
| DeleteApplicationButton | `#f5c6c6` | `#ddd9cc` | border-default |
| DeleteApplicationButton | `#c53030` | `#b42318` | error red |
| DeleteApplicationButton | `#fff5f5` | `#FEE2E2` | badge-red-bg |

**QA Steps:**
1. `grep -n '#ccc\|#fff4e9\|#b64a00\|#fdecec\|#d7d5ca\|#f5c6c6\|#c53030\|#fff5f5' components/profile/ProfileEditForm.tsx components/dashboard/DeleteApplicationButton.tsx` → must return zero results
2. `grep -n 'shadow-' components/profile/ProfileEditForm.tsx` → must return zero results
3. `npx tsc --noEmit` → exit code 0
4. `npm run build` → exit code 0

**Commit:** `fix(ui): replace non-standard colors with design system palette (M3)`

**Acceptance Criteria:**
- [ ] Zero non-standard color hex values in modified files (grep verification)
- [ ] No shadow-* classes on cards (grep verification)
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes

---

### W4-C: Standardize Error Messages to Korean (M4)

**Category:** `unspecified-low` | **Effort:** ~15 min | **Risk:** LOW

**Files to scan:** All files in `lib/actions/`

**Change:** Find all English error messages and translate to Korean. Common patterns:

| English | Korean |
|---------|--------|
| "Not authenticated" | "인증이 필요합니다." |
| "Not authorized" | "권한이 없습니다." |
| "Not found" | "찾을 수 없습니다." |
| "Invalid input" | "잘못된 입력입니다." |
| "Failed to fetch" | "데이터를 불러오지 못했습니다." |
| "Failed to create" | "생성에 실패했습니다." |
| "Failed to update" | "수정에 실패했습니다." |
| "Failed to delete" | "삭제에 실패했습니다." |

**Note:** Only change user-facing error messages. Internal logging can remain in English.

**QA Steps:**
1. `grep -rn 'return { error:' lib/actions/ | grep -v '한\|을\|는\|이\|의\|에\|다\.\|습니다\|세요\|주세요\|않\|없\|못'` → must return zero results (all error strings contain Korean characters)
2. `grep -rn "success: false.*error:" lib/actions/ | grep -viP '[가-힣]'` → must return zero results
3. `npx tsc --noEmit` → exit code 0
4. `npm run build` → exit code 0

**Commit:** `fix(i18n): standardize all server action errors to Korean (M4)`

**Acceptance Criteria:**
- [ ] All user-facing error messages contain Korean text (grep verification)
- [ ] Internal logging may remain English (console.error only)
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes

---

### W4-D: Dead Code Deletion (D1-D4)

**Category:** `quick` | **Effort:** ~15 min | **Risk:** LOW (verified zero imports)

**Files to DELETE:**
1. `components/CompanyShowcase.tsx` (~502 lines) — D1
2. `components/project/CompanyShowcase.tsx` (~502 lines) — D1

**Files to EDIT:**
3. `lib/api.ts` — Remove 6 unused exports (~100 lines) — D3:
   - `getFeaturedCompanies`
   - `getBreakthroughCompanies`
   - `getTopCompanies`
   - `getTeamDescriptions`
   - `getAllPersonSlugs`
   - `getMembersByProject`

4. `components/layout/Navbar.tsx` — Remove 2 commented-out blocks (~30 lines) — D4:
   - Lines 80-104 (recruitment banner)
   - Lines 205-210 (ApplyButton)

**NOTE on D2 (16 duplicate component pairs):** This is a SEPARATE task that should NOT be done in this remediation sprint. Deleting 16 subdirectory components requires verifying every import across 60+ pages. Schedule separately with thorough grep verification for each pair.

**QA Steps:**
1. `ls components/CompanyShowcase.tsx components/project/CompanyShowcase.tsx 2>&1` → "No such file" for both
2. `grep -rn 'CompanyShowcase' app/ components/ lib/ --include='*.tsx' --include='*.ts'` → zero results (no dangling imports)
3. `grep -rn 'getFeaturedCompanies\|getBreakthroughCompanies\|getTopCompanies\|getTeamDescriptions\|getAllPersonSlugs\|getMembersByProject' app/ components/ --include='*.tsx' --include='*.ts'` → zero results
4. `npx tsc --noEmit` → exit code 0
5. `npm run build` → exit code 0

**Commit:** `chore: remove dead code — CompanyShowcase, unused api.ts exports, commented Navbar code (D1, D3, D4)`

**Acceptance Criteria:**
- [ ] Deleted files don't exist (ls verification)
- [ ] Zero dangling imports for deleted code (grep verification)
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes

---

### Wave 4 Verification Gate

```bash
npx tsc --noEmit
npm run build
npm run test:unit
npm run test  # Full E2E suite
```

---

## Atomic Commit Strategy

Each task produces exactly ONE commit. Commits are ordered for clean `git bisect`:

```
fix/code-review-remediation branch:

 1. fix: add shared security utilities (UUID validator, HTML sanitizer, magic-byte checker)  [W0]
 2. fix(security): sanitize blog HTML + add UUID validation to posts.ts (C1, C5)              [W1-A]
 3. fix(security): check is_admin flag in middleware + admin layout gate (C2)                  [W1-B]
 4. fix(security): use atomic DB function for last-admin protection (C3)                      [W1-C]
 5. fix: standardize tracker.ts error handling to return result objects (C4)                   [W1-D]
 6. fix(security): validate UUID format on comment ID parameters (C5)                         [W1-E]
 7. fix(security): add role check + magic byte validation to upload endpoints (H1, H2)        [W2-A]
 9. fix(security): use global scope for logout to invalidate all sessions (H3)                [W2-C]
10. fix(security): add rate limiting to auth endpoints (H4)                                   [W2-D]
11. fix(security): add IP-based dedup and rate limiting to view count (H5)                    [W2-E]
12. fix(security): add auth, rate limit, and SSRF protection to Padlet proxy (H8)             [W3-A]
13. perf: optimize getEventsByBatch with nested Supabase select (H6)                          [W3-B]
14. fix(types): add missing table types and remove 'as never' casts (H7)                      [W3-C]
15. feat(seo): add metadata to all admin and public pages (H9, H10)                           [W3-D]
16. fix(security): add Content-Security-Policy header (M1)                                    [W3-E]
17. fix(security): protect CSV export from formula injection (M2)                              [W4-A]
18. fix(ui): replace non-standard colors with design system palette (M3)                       [W4-B]
19. fix(i18n): standardize all server action errors to Korean (M4)                             [W4-C]
20. chore: remove dead code — CompanyShowcase, unused api.ts exports, commented Navbar (D1-D4) [W4-D]
```

**Merge strategy (per AGENTS.md branch policy):**
```bash
# 1. Push feature branch
git push origin fix/code-review-remediation

# 2. Merge to dev (AGENTS.md protocol: direct merge, not PR)
git checkout dev && git pull origin dev
git merge fix/code-review-remediation --no-edit && git push origin dev

# 3. Verify Vercel preview deployment on dev

# 4. Promote to main (AGENTS.md protocol: direct merge)
git checkout main && git pull origin main
git merge dev --no-edit && git push origin main

# 5. Return to dev
git checkout dev
```

> **Note:** AGENTS.md mandates `feature → dev → main` via direct merge with `--no-edit`.
> README.md suggests PR-based flow for human collaborators. Since this is an automated
> agent-driven remediation, we follow the AGENTS.md protocol. If branch protections
> block direct push, fall back to `gh pr create --base dev` instead.

---

## Verification Protocol

### Per-Wave Checks (automated)
```bash
npx tsc --noEmit          # Type safety
npm run build             # Build integrity
npm run test:unit         # Unit test suite
```

### Final Verification (after all waves)
```bash
npx tsc --noEmit          # Full type check
npm run build             # Production build
npm run test:unit         # All unit tests
npm run test              # E2E tests (Playwright)
npm run lint              # ESLint
```

### Manual Spot Checks
- [ ] Blog post renders correctly (XSS fix didn't break formatting)
- [ ] Admin pages accessible by admins (middleware fix works)
- [ ] Image upload works for authorized roles
- [ ] Logout clears all sessions
- [ ] View count increments once per visit
- [ ] Padlet embed still works on curriculum page
- [ ] CSV export downloads correctly
- [ ] No visual regressions on ProfileEditForm / DeleteApplicationButton

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **DOMPurify strips valid blog content** | MEDIUM | HIGH | Test with real blog posts before merge. Keep allowed tags/attrs generous. Can always widen later. |
| **CSP breaks Supabase realtime** | MEDIUM | HIGH | Test WebSocket connections after CSP. Add `wss://*.supabase.co` to connect-src. Can roll back CSP independently. |
| **Middleware is_admin check creates lockout** | LOW | CRITICAL | Test with multiple user roles. Verify existing preneur users still work. The check is OR-based (preneur OR is_admin). |
| **tracker.ts return format breaks callers** | MEDIUM | MEDIUM | Must update ALL callers. Grep for every function import. Test each admin page that uses tracker. |
| **Type regeneration breaks existing code** | LOW | MEDIUM | Run `tsc --noEmit` immediately after type changes. If manual types conflict with generated, prefer generated. |
| **Dead code deletion breaks unused import** | LOW | LOW | All verified zero-import. `npm run build` catches any missed reference. |
| **N+1 query change alters data shape** | MEDIUM | MEDIUM | Compare before/after output shape. Fall back to current 3-query approach if shape differs. |
| **Rate limiting too aggressive** | LOW | LOW | Start with generous limits (5 req/15min for login). Monitor and tighten later. |

### Rollback Strategy
Each commit is atomic and independent within its wave. If a specific fix causes issues:
1. `git revert <commit-hash>` for the specific fix
2. Push to dev, verify, promote to main
3. File a follow-up issue for the reverted fix

---

## Ultrawork Execution Configuration

**Total parallel agents per wave:**
- Wave 0: 1 agent (sequential)
- Wave 1: 5 agents (W1-A through W1-E)
- Wave 2: 5 agents (W2-A through W2-E)
- Wave 3: 5 agents (W3-A through W3-E)
- Wave 4: 4 agents (W4-A through W4-D)

**Agent category mapping:**

| Task | Category | Rationale |
|------|----------|-----------|
| W0 (shared utils) | `quick` | Simple utility files + tests |
| W1-A (XSS) | `deep` | Touches read + write paths, needs careful sanitizer config |
| W1-B (middleware) | `quick` | Single file, small change |
| W1-C (race condition) | `deep` | SQL migration + RPC refactor |
| W1-D (tracker errors) | `unspecified-low` | Repetitive pattern change across 8 functions + callers |
| W1-E (UUID validation) | `unspecified-low` | Add validation to multiple files, pattern-based |
| W2-A (upload role) | `quick` | Add role check, copy existing pattern |
| ~~W2-B~~ | ~~merged into W2-A~~ | — |
| W2-C (logout scope) | `quick` | 3 one-line changes |
| W2-D (auth rate limit) | `unspecified-low` | Apply existing utility to 4 functions |
| W2-E (view count) | `quick` | Small file, straightforward |
| W3-A (padlet) | `quick` | Add auth + validation to API route |
| W3-B (N+1 query) | `unspecified-low` | Query refactor, careful data shape |
| W3-C (type casts) | `quick` | Type declarations + remove casts |
| W3-D (metadata) | `quick` | Repetitive, 17 files same pattern |
| W3-E (CSP) | `quick` | Config change, but needs careful testing |
| W4-A (CSV) | `quick` | Small function change |
| W4-B (colors) | `visual-engineering` | Design system compliance |
| W4-C (i18n) | `unspecified-low` | Search-and-replace across action files |
| W4-D (dead code) | `quick` | Delete files, remove exports |

---

## Deferred Items (NOT in this sprint)

1. **D2: 16 duplicate component pairs** — Requires thorough import verification for each pair. Schedule as a separate cleanup sprint with its own plan.
2. **Database migration for existing blog content** — Sanitizing content already in DB should be a one-time migration script, run after the code fix is deployed. Schedule separately.
3. **Redis-based rate limiting** — Current in-memory rate limiter is acceptable for single-instance Vercel. Upgrade to Upstash Redis only if scaling to multi-instance.
4. **Supabase type regeneration** — If `supabase gen types` is available and working, use it instead of manual type declarations for H7. This depends on having a working Supabase CLI connection.

---

## Summary

| Metric | Value |
|--------|-------|
| Total tasks | 20 (1 infra + 5 critical + 5 high-security + 5 high-quality + 4 cleanup) |
| Total files modified | ~45 files |
| Total files deleted | 2 files (~1,004 lines removed) |
| New files created | 4 (3 utilities + 1 migration) |
| New test files | ~12 |
| Estimated total effort | ~3 hours with parallel execution |
| Max parallel agents | 5 (per wave) |
| Commits | 20 atomic commits |
