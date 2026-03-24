# Open Questions

## click-latency-and-feedback-ui - 2026-03-24

- [ ] Should `force-dynamic` on `app/blog/[slug]/page.tsx` be replaced with `revalidate = 60` (like blog/edit) to enable ISR caching? — Currently every blog post visit hits Supabase; ISR would cache for 60s and eliminate the Supabase round-trip for repeat visitors. But it would mean comments/reactions are up to 60s stale on page load (Suspense streaming still fetches them fresh if the page itself is streamed).
- [ ] Should the `app/u/[slug]/page.tsx` fallback Supabase query (lines 268-274, checking if slug is a member) be moved into a separate Suspense boundary or removed? — Currently if the public profile doesn't exist, the page makes ANOTHER Supabase call to check if the slug matches a member for redirect. This adds latency for a 404 path.
- [ ] Should admin sub-pages (`/admin/users`, `/admin/applications`, etc.) each get their own `loading.tsx` or rely solely on the parent `/admin/loading.tsx`? — Parent loading.tsx will show for the entire admin content area. Individual loading.tsx would allow the sidebar to remain interactive while only the content pane shows a skeleton. Given the admin layout has a fixed sidebar, individual loading.tsx may be better UX.
- [ ] The `components/Navbar.tsx` and `components/layout/Navbar.tsx` both have `router.push("/")` after logout — are these two separate Navbars or is one deprecated? — If one is deprecated it should be excluded from Task 5 changes.

## unify-profile-urls — 2026-03-24

- [ ] Should `/u/[slug]` redirect use 307 (temporary) or 308 (permanent)? — Permanent (308) is better for SEO since this is a deliberate canonical change, but temporary (307) is safer if we might revert. **Recommendation: 308 permanent (`permanentRedirect()`).**
- [ ] The `PeoplePage` fallback href (line 124) falls back to `/u/${member.slug}` for members _without_ a resolved public profile — should this fall back to `/profile/${member.slug}` (consistent) or `/people/${member.slug}` (more accurate since no public profile exists)? — **Recommendation: `/profile/${member.slug}`** to maintain consistency; the `/profile/[slug]` page already handles the fallback to `/people/[slug]` when no public profile exists.
- [ ] Should the `PeoplePage` fallback (for members without public profiles) be changed from `/profile/${member.slug}` to `/people/${member.slug}`? — This avoids a double-redirect (`/profile/[slug]` → checks no public profile → redirects to `/people/[slug]`). But it breaks URL consistency since some cards would link to `/profile/` and others to `/people/`. **Recommendation: Keep `/profile/${member.slug}` for consistency — the redirect hop is negligible.**

## recruitment-management-system (v2) — 2026-03-24

- [ ] Should Zod be added as a dependency, or should we use manual validation matching `lib/actions/applications.ts` pattern? — Check `package.json` for existing Zod dep. If absent, manual validation avoids adding a dependency for one feature. **Recommendation: Check first; if absent, use manual validation with the same pattern as applications.**
- [ ] Should the `applications.batch` column have a foreign key to `recruitment_settings.batch`? — Enforces integrity but requires seed data before accepting applications. **Recommendation: Add FK with seed data in same migration (025).**
- [ ] Should the waitlist phone number be normalized (strip hyphens) before storing, or store as-is with formatting? — Normalization makes dedup simpler but raw format is more readable for admin. **Recommendation: Strip hyphens, store digits only (01012345678). Format for display in admin UI.**
- [ ] How should the apply page handle the transition from hardcoded to DB-driven mid-deployment? — The hardcoded fallback in `recruitment-schedule.ts` covers this, but operators need to run the migration before the new code deploys. **Recommendation: Deploy migration first, then code.**
- [ ] Should past cohort recruitment_settings rows be immutable? — **Recommendation: UI warning "이 기수의 모집은 이미 마감되었습니다" but don't block edits.**
- [ ] Should the RecruitmentBanner server component use `unstable_noStore()` or `revalidatePath` caching? — Banner data changes rarely (only on admin action). `revalidatePath("/")` in the server action should be sufficient. But `unstable_noStore()` guarantees freshness at cost of a DB hit per page load. **Recommendation: Rely on revalidatePath from server actions; no unstable_noStore.**
- [ ] The CTA component imports `RECRUITMENT_DEADLINE_LABEL` but doesn't render it (the ApplyButton was removed from JSX). Should we clean this up in this feature or leave it? — **Recommendation: Clean up as part of T1.2 (recruitment-schedule refactor) since we're already touching that module.**
