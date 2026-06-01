# Components

48 files across 10 directories. Server-first by default; use client components only for interaction.

## ORGANIZATION
| Directory | Files | Purpose |
|-----------|-------|---------|
| root (21) | Shared + duplicates | Layout, page sections, utilities |
| blog/ (9) | Blog feature | ArticleCard, CommentSection, ReactionBar, BlockNoteEditor |
| home/ (1) | Landing page | Home-specific section kept outside root |
| about/ (4) | About page | Achievements, InTheRoom, VCCSection |
| profile/ (4) | User profile | ProfileEditForm, ProfileAvatarEditor, PublicProfileEditor |
| layout/ (1) | Global layout | Duplicate shell component; root versions are canonical |
| ui/ (4) | Primitives | ApplyButton, CustomSelect, RouteLoading, Toast |
| project/ (1) | Showcase | CompanyShowcase (DO NOT USE — hotlinked images) |
| partners/ (2) | Partners | Partners + PartnersContent |
| dashboard/ (3) | Learner/admin dashboard | Learner dashboard/homework clients + delete button |
| curriculum/ (1) | Curriculum | CurriculumCalendar |

## SERVER vs CLIENT RULE
- Default: server component (no directive)
- Client ONLY when: useState, useEffect, useRouter, event handlers, or IntersectionObserver
- Mark with `"use client"` at top

## KNOWN ISSUES
- 22 duplicate components at root vs subdirectory — root versions are canonical (imported in layout.tsx)
- `CompanyShowcase.tsx` + `project/CompanyShowcase.tsx`: hotlinked YC images, DO NOT deploy
- Root components should eventually be moved to proper subdirectories

## IMPORT PATTERN
- Server actions: import from `@/lib/actions/*` (ok in client components — creates RPC boundary)
- Auth constants: import from `@/lib/auth-shared` in client components (NOT `@/lib/auth`)
- Auth server functions: import from `@/lib/auth` only in server components
