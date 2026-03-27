-- Restore RLS policies dropped by CASCADE in 20260327120000 (DROP FUNCTION is_admin() CASCADE).
-- All policies now use column-based is_admin check instead of the deleted function.

DROP POLICY IF EXISTS "posts_read_published_or_owner_or_admin" ON public.posts;
CREATE POLICY "posts_read_published_or_owner_or_admin"
  ON public.posts FOR SELECT
  USING (
    published = true
    OR auth.uid() = author_id
    OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur'
  );

DROP POLICY IF EXISTS "posts_insert_news_by_admin" ON public.posts;
CREATE POLICY "posts_insert_news_by_admin"
  ON public.posts FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND type = 'news'
    AND (
      (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
      OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur'
    )
  );

DROP POLICY IF EXISTS "posts_update_author_or_admin" ON public.posts;
CREATE POLICY "posts_update_author_or_admin"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = author_id
    OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur'
  )
  WITH CHECK (
    auth.uid() = author_id
    OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur'
  );

DROP POLICY IF EXISTS "posts_delete_author_or_admin" ON public.posts;
CREATE POLICY "posts_delete_author_or_admin"
  ON public.posts FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_id
    OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur'
  );

DROP POLICY IF EXISTS "tags_insert_admin" ON public.tags;
CREATE POLICY "tags_insert_admin"
  ON public.tags FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur'
  );

DROP POLICY IF EXISTS "tags_update_admin" ON public.tags;
CREATE POLICY "tags_update_admin"
  ON public.tags FOR UPDATE
  TO authenticated
  USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur'
  )
  WITH CHECK (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur'
  );

DROP POLICY IF EXISTS "tags_delete_admin" ON public.tags;
CREATE POLICY "tags_delete_admin"
  ON public.tags FOR DELETE
  TO authenticated
  USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur'
  );

DROP POLICY IF EXISTS "post_tags_manage_author_or_admin_insert" ON public.post_tags;
CREATE POLICY "post_tags_manage_author_or_admin_insert"
  ON public.post_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_id
        AND (
          p.author_id = auth.uid()
          OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
          OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur'
        )
    )
  );

DROP POLICY IF EXISTS "post_tags_manage_author_or_admin_delete" ON public.post_tags;
CREATE POLICY "post_tags_manage_author_or_admin_delete"
  ON public.post_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_id
        AND (
          p.author_id = auth.uid()
          OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
          OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur'
        )
    )
  );

DROP POLICY IF EXISTS "comments_delete_author_or_admin" ON public.comments;
CREATE POLICY "comments_delete_author_or_admin"
  ON public.comments FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_id
    OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur'
  );

DROP POLICY IF EXISTS "reactions_delete_own" ON public.reactions;
CREATE POLICY "reactions_delete_own"
  ON public.reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
