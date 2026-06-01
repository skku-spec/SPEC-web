# Learner Dashboard Routes

Learner-only dashboard for attendance, homework visibility, and homework submission.

## STRUCTURE
| Path | Purpose |
|------|---------|
| `layout.tsx` | `requireRole("learner")`; redirects non-learners to admin attendance |
| `page.tsx` | Fetches tracker data and renders `LearnerDashboardClient` |
| `homework/page.tsx` | Fetches tracker data and renders `LearnerHomeworkClient` |
| `DashboardNav.tsx` | Client desktop/mobile nav with active path handling |
| `DashboardSidebar.tsx` | Desktop sidebar shell |
| `nav-items.ts` | Dashboard nav definitions |

## WHERE TO LOOK
| Task | Location |
|------|----------|
| Attendance/homework data | `lib/actions/tracker.ts` |
| Homework stats | `lib/homework-utils.ts` |
| Dashboard UI clients | `components/dashboard/` |
| Admin attendance/homework management | `app/admin/attendance/`, `app/admin/homework/` |
| Route protection tests | `e2e/protected-routes.spec.ts` |

## CONVENTIONS
- This surface is for `learner` role only; preneur/admin users go to admin attendance.
- Pages are server components that fetch with `getTrackerData()` and hand plain data to client components.
- Client components must import server actions from `@/lib/actions/tracker` only for user-triggered mutations.
- Keep dashboard content within `mx-auto max-w-4xl` unless adding an admin-style table view.
- Dashboard navigation uses lucide icons in `nav-items.ts`; add labels with every icon.

## ANTI-PATTERNS
- Do not expose admin tracker mutation controls in learner dashboard clients.
- Do not duplicate admin attendance/homework layout patterns here; admin pages stay under `app/admin`.
- Do not add role checks only in the client; preserve the server `requireRole("learner")` guard.
