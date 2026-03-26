-- Step 1: Add is_admin column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Step 2: Set is_admin for current admin users
UPDATE public.profiles SET is_admin = true WHERE role = 'admin'::user_role;

-- Step 3: Convert admin users to preneur
UPDATE public.profiles SET role = 'preneur'::user_role WHERE role = 'admin'::user_role;

-- Step 4a: Drop ALL policies that reference profiles.role column
DROP POLICY IF EXISTS "form_fields_admin_modify" ON public.application_form_fields;
DROP POLICY IF EXISTS "Admins can delete applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can update applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.applications;
DROP POLICY IF EXISTS "Members can view all applications" ON public.applications;
DROP POLICY IF EXISTS "Admins/Preneurs can manage logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Admins/Preneurs can manage sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Runners can view sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "audit_logs_admin_read" ON public.audit_logs;
DROP POLICY IF EXISTS "curriculum_areas_admin_modify" ON public.curriculum_areas;
DROP POLICY IF EXISTS "curriculum_weeks_admin_modify" ON public.curriculum_weeks;
DROP POLICY IF EXISTS "faq_items_admin_modify" ON public.faq_items;
DROP POLICY IF EXISTS "Admins/Preneurs can manage submissions" ON public.homework_submissions;
DROP POLICY IF EXISTS "Admins can manage team assignments" ON public.homework_team_assignments;
DROP POLICY IF EXISTS "Only admins can delete homeworks" ON public.homeworks;
DROP POLICY IF EXISTS "Only admins can insert homeworks" ON public.homeworks;
DROP POLICY IF EXISTS "Only admins can update homeworks" ON public.homeworks;
DROP POLICY IF EXISTS "partners_admin_modify" ON public.partners;
DROP POLICY IF EXISTS "profile_experiences_read_public_or_owner_or_admin" ON public.profile_experiences;
DROP POLICY IF EXISTS "Admins can manage recruitment settings" ON public.recruitment_settings;
DROP POLICY IF EXISTS "Admins can delete from waitlist" ON public.recruitment_waitlist;
DROP POLICY IF EXISTS "Admins can view waitlist" ON public.recruitment_waitlist;
DROP POLICY IF EXISTS "site_settings_admin_modify" ON public.site_settings;
DROP POLICY IF EXISTS "spec_events_delete" ON public.spec_events;
DROP POLICY IF EXISTS "spec_events_insert" ON public.spec_events;
DROP POLICY IF EXISTS "spec_events_update" ON public.spec_events;
DROP POLICY IF EXISTS "spec_log_comments_delete" ON public.spec_log_comments;
DROP POLICY IF EXISTS "spec_log_comments_insert" ON public.spec_log_comments;
DROP POLICY IF EXISTS "spec_log_images_delete" ON public.spec_log_images;
DROP POLICY IF EXISTS "spec_log_reactions_insert" ON public.spec_log_reactions;
DROP POLICY IF EXISTS "spec_logs_delete" ON public.spec_logs;
DROP POLICY IF EXISTS "spec_logs_insert" ON public.spec_logs;
DROP POLICY IF EXISTS "can_write" ON public.posts;
DROP POLICY IF EXISTS "Allow authenticated upload" ON storage.objects;

DROP POLICY IF EXISTS "posts_insert_blog_by_writer" ON public.posts;
DROP POLICY IF EXISTS "comments_insert_writer_own_author" ON public.comments;
DROP POLICY IF EXISTS "reactions_insert_writer_own_user" ON public.reactions;
DROP FUNCTION IF EXISTS public.can_write();

-- Step 4c: Create new enum type
CREATE TYPE user_role_new AS ENUM ('outsider', 'learner', 'alumni', 'preneur');

-- Step 5: Alter column to use new enum
ALTER TABLE public.profiles
  ALTER COLUMN role DROP DEFAULT,
  ALTER COLUMN role TYPE user_role_new USING role::text::user_role_new,
  ALTER COLUMN role SET DEFAULT 'outsider'::user_role_new;

-- Step 6: Drop old enum and rename
DROP FUNCTION IF EXISTS public.get_user_role();
DROP FUNCTION IF EXISTS public.is_public_author_profile(user_role, profile_visibility);
DROP TYPE user_role;
ALTER TYPE user_role_new RENAME TO user_role;

-- Step 6b: Recreate ALL dropped non-spec-log policies with is_admin pattern
CREATE POLICY "form_fields_admin_modify" ON public.application_form_fields
  FOR ALL TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur');

CREATE POLICY "Admins can view all applications" ON public.applications
  FOR SELECT TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur');

CREATE POLICY "Admins can update applications" ON public.applications
  FOR UPDATE TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur');

CREATE POLICY "Admins can delete applications" ON public.applications
  FOR DELETE TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur');

CREATE POLICY "Members can view all applications" ON public.applications
  FOR SELECT TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('learner', 'alumni', 'preneur'));

CREATE POLICY "Admins/Preneurs can manage logs" ON public.attendance_logs
  FOR ALL TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur');

CREATE POLICY "Admins/Preneurs can manage sessions" ON public.attendance_sessions
  FOR ALL TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur');

CREATE POLICY "Learners can view sessions" ON public.attendance_sessions
  FOR SELECT TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('learner', 'preneur'));

CREATE POLICY "curriculum_areas_admin_modify" ON public.curriculum_areas
  FOR ALL TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur');

CREATE POLICY "curriculum_weeks_admin_modify" ON public.curriculum_weeks
  FOR ALL TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur');

CREATE POLICY "faq_items_admin_modify" ON public.faq_items
  FOR ALL TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur');

CREATE POLICY "Admins/Preneurs can manage submissions" ON public.homework_submissions
  FOR ALL TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur');

CREATE POLICY "Admins can manage team assignments" ON public.homework_team_assignments
  FOR ALL TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur');

CREATE POLICY "Only admins can insert homeworks" ON public.homeworks
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur');

CREATE POLICY "Only admins can update homeworks" ON public.homeworks
  FOR UPDATE TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur');

CREATE POLICY "Only admins can delete homeworks" ON public.homeworks
  FOR DELETE TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur');

CREATE POLICY "partners_admin_modify" ON public.partners
  FOR ALL TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur');

CREATE POLICY "profile_experiences_read_public_or_owner_or_admin" ON public.profile_experiences
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage recruitment settings" ON public.recruitment_settings
  FOR ALL TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur');

CREATE POLICY "Admins can view waitlist" ON public.recruitment_waitlist
  FOR SELECT TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur');

CREATE POLICY "Admins can delete from waitlist" ON public.recruitment_waitlist
  FOR DELETE TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur');

CREATE POLICY "site_settings_admin_modify" ON public.site_settings
  FOR ALL TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'preneur');

-- Step 7: Update can_write() function
CREATE OR REPLACE FUNCTION public.can_write()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('learner', 'alumni', 'preneur')
  );
$$;

-- Step 8: Update spec_logs delete policy to check is_admin instead of role='admin'
DROP POLICY IF EXISTS "spec_logs_delete" ON public.spec_logs;
CREATE POLICY "spec_logs_delete" ON public.spec_logs
  FOR DELETE TO authenticated
  USING (
    author_id = auth.uid()
    OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
  );

-- Step 9: Update spec_log_images delete policy
DROP POLICY IF EXISTS "spec_log_images_delete" ON public.spec_log_images;
CREATE POLICY "spec_log_images_delete" ON public.spec_log_images
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.spec_logs WHERE id = log_id AND (
      author_id = auth.uid()
      OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
    )
  ));

-- Step 10: Update spec_log_comments delete policy
DROP POLICY IF EXISTS "spec_log_comments_delete" ON public.spec_log_comments;
CREATE POLICY "spec_log_comments_delete" ON public.spec_log_comments
  FOR DELETE TO authenticated
  USING (
    author_id = auth.uid()
    OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
  );

-- Step 11: Update spec_events write policies to check is_admin OR preneur role
DROP POLICY IF EXISTS "spec_events_insert" ON public.spec_events;
CREATE POLICY "spec_events_insert" ON public.spec_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND (role = 'preneur' OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "spec_events_update" ON public.spec_events;
CREATE POLICY "spec_events_update" ON public.spec_events
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
    AND (role = 'preneur' OR is_admin = true)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
    AND (role = 'preneur' OR is_admin = true)
  ));

DROP POLICY IF EXISTS "spec_events_delete" ON public.spec_events;
CREATE POLICY "spec_events_delete" ON public.spec_events
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
    AND (role = 'preneur' OR is_admin = true)
  ));

-- Step 12: Update spec_logs insert to include alumni for comments/reactions but NOT log creation
-- spec_logs INSERT stays learner+preneur only (alumni cannot create logs)
DROP POLICY IF EXISTS "spec_logs_insert" ON public.spec_logs;
CREATE POLICY "spec_logs_insert" ON public.spec_logs
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
    AND role IN ('learner', 'preneur')
  ));

-- Step 13: Update comment/reaction insert policies to include alumni
DROP POLICY IF EXISTS "spec_log_comments_insert" ON public.spec_log_comments;
CREATE POLICY "spec_log_comments_insert" ON public.spec_log_comments
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
    AND role IN ('learner', 'alumni', 'preneur')
  ));

DROP POLICY IF EXISTS "spec_log_reactions_insert" ON public.spec_log_reactions;
CREATE POLICY "spec_log_reactions_insert" ON public.spec_log_reactions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
    AND role IN ('learner', 'alumni', 'preneur')
  ));

-- Step 14: Update audit_logs read policy to use is_admin
DROP POLICY IF EXISTS "audit_logs_admin_read" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_read" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
    AND (role = 'preneur' OR is_admin = true)
  ));

CREATE POLICY "posts_insert_blog_by_writer" ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write());

CREATE POLICY "comments_insert_writer_own_author" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write() AND author_id = auth.uid());

CREATE POLICY "reactions_insert_writer_own_user" ON public.reactions
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write() AND user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;
