-- Enable anonymous read access for shared spec-log thread links.
-- This allows non-authenticated users to view shared spec-log posts
-- via public URLs (e.g. /spec-log/[eventId]/[logId]).
--
-- NOTE: profiles table already has unrestricted SELECT via the
-- existing "profiles_read_all" policy (001-init.sql). No additional
-- policy is needed for profiles. All anonymous-facing server actions
-- MUST select only (id, name) from profiles — enforced at the
-- application layer.
--
-- These policies are SELECT-only. No write access is granted to anon.

CREATE POLICY "anon_select_spec_events"
  ON public.spec_events
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "anon_select_spec_logs"
  ON public.spec_logs
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "anon_select_spec_log_images"
  ON public.spec_log_images
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "anon_select_spec_log_comments"
  ON public.spec_log_comments
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "anon_select_spec_log_reactions"
  ON public.spec_log_reactions
  FOR SELECT TO anon
  USING (true);
