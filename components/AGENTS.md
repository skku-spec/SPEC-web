# Components

40 files across 7 directories. Server-first by default; use client components only for interaction.

## ORGANIZATION
| Directory | Files | Purpose |
|-----------|-------|---------|
| root (16) | Shared | Layout, page sections, utilities |
| blog/ (9) | Blog feature | ArticleCard, CommentSection, ReactionBar, BlockNoteEditor |
| profile/ (4) | User profile | ProfileEditForm, ProfileAvatarEditor, PublicProfileEditor |
| ui/ (4) | Primitives | ApplyButton, CustomSelect, RouteLoading, Toast |
| partners/ (1) | Partners | PartnersContent |
| dashboard/ (5) | Learner/admin dashboard | Learner dashboard/homework clients, attendance check-in/QR, delete button |
| curriculum/ (1) | Curriculum | CurriculumCalendar |

## SERVER vs CLIENT RULE
- Default: server component (no directive)
- Client ONLY when: useState, useEffect, useRouter, event handlers, or IntersectionObserver
- Mark with `"use client"` at top

## KNOWN ISSUES
- Root components should eventually be moved to proper subdirectories

## IMPORT PATTERN
- Server actions: import from `@/lib/actions/*` (ok in client components — creates RPC boundary)
- Auth constants: import from `@/lib/auth-shared` in client components (NOT `@/lib/auth`)
- Auth server functions: import from `@/lib/auth` only in server components
