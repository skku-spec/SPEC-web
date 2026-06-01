# Blog Routes

Blog listing, article pages, write/edit routes, tag pages, and the rich post editor.

## STRUCTURE
| Path | Purpose |
|------|---------|
| `page.tsx` | Server listing entry; fetches posts, tags, trending posts from `lib/api.ts` |
| `BlogPageClient.tsx` | Client-side filtering/sorting/pagination shell |
| `[slug]/page.tsx` | Article page, metadata, author actions, comments/reactions |
| `write/page.tsx` | Client route that renders `PostEditorForm` in create mode |
| `edit/[slug]/page.tsx` | Server auth/ownership check, then `PostEditorForm` edit mode |
| `tag/[tag]/page.tsx` | Tag-filtered listing with static params |
| `PostEditorForm.tsx` | Cover upload, BlockNote editor, autosave, tag selection |
| `[slug]/blog-post-content.css` | Article HTML content styling |

## WHERE TO LOOK
| Task | Location |
|------|----------|
| Post CRUD | `lib/actions/posts.ts` |
| Comments | `lib/actions/comments.ts` + `components/blog/CommentSection.tsx` |
| Reactions | `lib/actions/reactions.ts` + `components/blog/ReactionBar.tsx` |
| Tags | `lib/actions/tags.ts` + `components/blog/CategoryTabs.tsx` |
| View counts | `lib/actions/views.ts` |
| Image upload | `lib/storage.ts` (`uploadBlogImage`) |

## CONVENTIONS
- Public reads mostly go through `lib/api.ts`; mutations go through server actions.
- Client blog auth imports must come from `@/lib/auth-shared`, not `@/lib/auth`.
- Writer role gate is `BLOG_WRITER_ROLES` (`learner`, `alumni`, `preneur`).
- Edit route allows post owner or `is_admin`; keep this check server-side.
- `PostEditorForm` is intentionally client-only and passes HTML from BlockNote to actions.
- `BlockNoteEditor` lives in `components/blog/` and imports BlockNote CSS directly.
- Revalidate affected blog paths in server actions after post/tag/comment/reaction changes.

## ANTI-PATTERNS
- Do not pass server functions/components as props into blog client components.
- Do not import `@/lib/auth` in blog client files.
- Do not replace `blog-post-content.css` with Tailwind-only styling; rendered HTML needs descendant selectors.
- For new icons, use `lucide-react`; existing inline SVGs are legacy, not the pattern to copy.
