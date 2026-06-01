# Blog Components

Blog UI components shared by listing, article detail, editor, comments, and reactions.

## FILES
| File | Role |
|------|------|
| `ArticleCard.tsx` | Server-safe listing card |
| `AuthorBio.tsx` | Server-safe author summary |
| `BlockNoteEditor.tsx` | Client-only BlockNote wrapper and theme |
| `CategoryTabs.tsx` | Client tag tabs |
| `CommentSection.tsx` | Client threaded comments/replies/delete |
| `Pagination.tsx` | Client pagination controls |
| `ReactionBar.tsx` | Client reaction summary/toggle |
| `SortSelect.tsx` | Client sort control |
| `TrendingSidebar.tsx` | Server-safe trending posts sidebar |

## CONVENTIONS
- Default to server components unless state, effects, router, or event handlers are required.
- Client components can import server actions from `@/lib/actions/*`; that is the intended mutation boundary.
- Auth/role constants in client components must come from `@/lib/auth-shared`.
- `BlockNoteEditor` owns BlockNote CSS imports and theme tokens; do not duplicate editor globals elsewhere.
- Preserve Korean date/text formatting in comments and article metadata.
- Keep reaction/comment optimistic UI reversible when server actions fail.

## ANTI-PATTERNS
- Do not import `@/lib/auth` or `@/lib/supabase/server` in this directory.
- Do not move blog route-specific data fetching into these components.
- Do not replace root design-system colors with ad hoc blues/grays.
- Do not copy legacy inline SVGs from `app/blog`; use `lucide-react` for new icons.
