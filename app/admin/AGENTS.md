# Admin Pages

19 admin pages under `/admin/*`. Admin access is `preneur` role or `is_admin=true`; some mutations still require the stricter `is_admin` flag.

## LAYOUT
- `layout.tsx`: `requireAdmin()` shared guard, desktop sidebar + mobile bottom nav
- Sidebar: `AdminSidebar.tsx` reads from `nav-items.ts`
- Mobile: `AdminBottomNav.tsx` (4 tabs) + `AdminMoreSheet.tsx` (overflow)
- Content: `mx-auto max-w-6xl`, padding `px-5 py-6 sm:px-8 sm:py-10 lg:px-10`

## PAGE PATTERN
Most admin list/CRUD pages follow server → client handoff:
```
page.tsx (server):
  // Inherits requireAdmin() from app/admin/layout.tsx.
  const data = await getXxx()
  return <XxxClient initialData={data} />

XxxClient.tsx (client):
  "use client"
  receives initialData as props
  manages local state + server action calls
  router.refresh() after mutations
```

## DESIGN SYSTEM (admin-specific)
- H1: `mb-6 font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black`
- Table: `rounded-lg border border-[#ddd9cc] bg-white`, thead `bg-[#f0efe6]`
- Buttons: `h-8 rounded-md` (primary: `bg-[#16140f]`, secondary: `border-[#ddd9cc]`)
- Empty state: `colSpan`, `py-8 text-center text-sm text-[#6b6b5e]`
- Modal: `fixed inset-0 z-50 bg-black/50`, card `max-w-lg rounded-lg bg-white p-6`

## NAV ITEMS
Defined in `nav-items.ts`. Groups: primary, content, operations, system. Icons: lucide-react only.

## PAGES
| Page | Client file | Server action |
|------|-------------|---------------|
| Dashboard | DashboardClient.tsx | tracker.ts |
| Members | MembersClient.tsx | members.ts |
| Applications | ApplicationsClient.tsx | applications.ts |
| Application Detail | applications/[id]/page.tsx | direct Supabase read + DeleteApplicationButton |
| Attendance | AttendanceClient.tsx | tracker.ts |
| Homework | HomeworkClient.tsx | tracker.ts |
| Posts | PostsClient.tsx | posts.ts |
| New News Post | posts/new/page.tsx | PostEditorForm + posts.ts |
| Tags | TagsClient.tsx | tags.ts |
| SPEC Log | SpecLogAdminClient.tsx | spec-log.ts |
| Ideas | IdeasClient.tsx | ideas.ts |
| Curriculum | CurriculumClient.tsx | curriculum.ts |
| FAQ | FaqClient.tsx | faq.ts |
| Partners | PartnersClient.tsx | partners.ts |
| Users | UsersClient.tsx | admin.ts |
| Recruitment | RecruitmentSettingsClient.tsx | recruitment.ts |
| Form Builder | FormBuilderClient.tsx | form-builder.ts |
| Settings | SettingsClient.tsx | site-settings.ts |
| Audit | AuditClient.tsx | (reads audit_logs directly) |

## AUTH NUANCE
- `layout.tsx` uses `requireAdmin()` for the admin shell (`preneur` role or `is_admin=true`).
- `/admin/users` has extra `is_admin` checks for sensitive user-role/admin toggles.
- Keep mutation-level authorization in server actions; UI gating is only presentation.
- Detail/create pages may be server-only instead of `*Client.tsx`, but still inherit the admin shell guard.
