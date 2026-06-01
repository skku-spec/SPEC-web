# Application Flow

Recruitment entry, authenticated application form, submitted view, edit flow, and public status lookup.

## STRUCTURE
| Path | Purpose |
|------|---------|
| `page.tsx` | Recruitment gate, login redirect, existing-application summary |
| `form/page.tsx` | Fetches form fields and renders `client-form.tsx` |
| `form/client-form.tsx` | Multi-step application form and client validation |
| `edit/page.tsx` | Client edit flow backed by `getMyApplicationDetail` / `updateMyApplication` |
| `submitted/page.tsx` | Authenticated submitted application review |
| `status/page.tsx` | Public-ish status lookup surface |
| `RecruitmentClosedView.tsx` | Closed/reviewing/upcoming state |
| `status/ApplicationStatusCard.tsx` | Shared application status display |

## WHERE TO LOOK
| Task | Location |
|------|----------|
| Submit/update applications | `lib/actions/applications.ts` |
| Recruitment open/closed settings | `lib/actions/recruitment.ts` |
| Form-builder fields | `lib/actions/form-builder.ts` |
| Schedule constants | `lib/recruitment-schedule.ts` |
| Admin review UI | `app/admin/applications/` |
| Admin recruitment settings | `app/admin/recruitment/` |

## CONVENTIONS
- `/apply`, `/apply/form`, `/apply/edit`, and `/apply/submitted` require auth via middleware.
- `/apply/status` is excluded from the auth redirect.
- Public application INSERT must not chain `.select()`; `applications` SELECT is RLS-restricted.
- `submitApplication` rate-limits by IP and checks active recruitment before insert.
- Keep client validation aligned with server validation lengths in `applications.ts`.
- Application status values are `pending`, `under_review`, `accepted`, `rejected`.
- Recruitment settings are batch-keyed and one active recruiting batch closes the others.

## ANTI-PATTERNS
- Do not trust the multi-step client form as authorization or final validation.
- Do not use admin Supabase client for public submit paths.
- Do not add status strings outside the existing four-value union without migration, actions, admin UI, and tests.
- Do not use `border-[#d9d9cc]` or rounded-full CTA styling for new standard controls; follow root design rules.
