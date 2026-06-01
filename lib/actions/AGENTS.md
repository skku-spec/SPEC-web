# Server Actions

24 files, 7200+ lines. All marked `"use server"`.

## PATTERN
Every action file follows:
1. `createClient()` from `@/lib/supabase/server`
2. `supabase.auth.getUser()` → error if not logged in
3. Profile fetch → role check
4. Input validation (trim, length, format)
5. Supabase query → error handling
6. `revalidatePath()` for affected routes
7. Return `{ success, error?, data? }`

## AUTH CHECKS
- `BLOG_WRITER_ROLES` (learner, alumni, preneur) → posts, comments, reactions
- `SPEC_LOG_WRITER_ROLES` (learner, preneur) → spec-log creation
- `SPEC_LOG_ENGAGE_ROLES` (learner, alumni, preneur) → spec-log comments/reactions
- `isAdmin(profile)` → checks `is_admin` boolean, NOT role
- `requireRole("preneur")` → admin page mutations

Import role constants from `@/lib/auth` (server) or `@/lib/auth-shared` (client).

## FILES BY DOMAIN
| Domain | Files | Key exports |
|--------|-------|-------------|
| Auth | auth.ts | signIn, signUp, forgotPassword, resetPassword |
| Admin | admin.ts | updateUserRole, toggleAdminStatus |
| Blog | posts.ts, comments.ts, reactions.ts, tags.ts, views.ts | CRUD + tag resolution + emoji toggle |
| Ideas | ideas.ts | Ideathon idea submit/list/delete |
| SPEC Log | spec-log.ts, spec-log-comments.ts, spec-log-reactions.ts | Event/log CRUD + batch permission + image handling |
| Members | members.ts, member-conversion.ts | CRUD + slug gen + CSV export + app→member conversion |
| Profile | profile.ts, public-profile.ts | User profile + public profile with experiences |
| Recruitment | applications.ts, recruitment.ts | Application submit + status + waitlist + settings |
| Tracking | tracker.ts, export.ts | Attendance + homework + CSV export |
| Admin Config | curriculum.ts, faq.ts, partners.ts, site-settings.ts, form-builder.ts | Upsert-based CRUD for admin-managed content |

## CONVENTIONS
- Korean error messages: `throw new Error("권한이 없습니다.")`
- Audit logging: `logAuditEvent()` for admin mutations (admin.ts, members.ts, spec-log.ts, site-settings.ts)
- Slug generation: normalize NFKD → remove special chars → dedupe hyphens
- Image paths: extract storage path from full URL for deletion
- Public application submit must not chain `.select()` after INSERT; `applications` SELECT is restricted by RLS
- No `as any` or `@ts-ignore`
- No comments in code

## ANTI-PATTERNS
- `applications.ts` uses admin client for SELECT (RLS is admin-only on that table)
- Some tables (`faq_items`, `curriculum_*`, `form_fields`) not in generated types — cast as `never`
- `tracker.ts` throws on error (no try-catch), unlike other files
