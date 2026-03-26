-- 1. spec_events
CREATE TABLE public.spec_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text NOT NULL DEFAULT '',
  batch       text NOT NULL,
  status      text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('active', 'upcoming', 'closed')),
  start_date  date NOT NULL,
  end_date    date NOT NULL,
  created_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. spec_logs
CREATE TABLE public.spec_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES public.spec_events(id) ON DELETE CASCADE,
  author_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 3. spec_log_images
CREATE TABLE public.spec_log_images (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id      uuid NOT NULL REFERENCES public.spec_logs(id) ON DELETE CASCADE,
  image_url   text NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 4. spec_log_comments
CREATE TABLE public.spec_log_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id      uuid NOT NULL REFERENCES public.spec_logs(id) ON DELETE CASCADE,
  author_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     text NOT NULL,
  parent_id   uuid REFERENCES public.spec_log_comments(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 5. spec_log_reactions
CREATE TABLE public.spec_log_reactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id      uuid NOT NULL REFERENCES public.spec_logs(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji       text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(log_id, user_id, emoji)
);

-- Indexes
CREATE INDEX idx_spec_events_batch ON public.spec_events(batch);
CREATE INDEX idx_spec_events_status ON public.spec_events(status);
CREATE INDEX idx_spec_events_created ON public.spec_events(created_at DESC);
CREATE INDEX idx_spec_logs_event ON public.spec_logs(event_id);
CREATE INDEX idx_spec_logs_author ON public.spec_logs(author_id);
CREATE INDEX idx_spec_logs_created ON public.spec_logs(created_at DESC);
CREATE INDEX idx_spec_log_images_log ON public.spec_log_images(log_id);
CREATE INDEX idx_spec_log_comments_log ON public.spec_log_comments(log_id);
CREATE INDEX idx_spec_log_comments_parent ON public.spec_log_comments(parent_id);
CREATE INDEX idx_spec_log_reactions_log ON public.spec_log_reactions(log_id);

-- Updated-at triggers (set_updated_at function already exists)
CREATE TRIGGER set_spec_events_updated_at
  BEFORE UPDATE ON public.spec_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_spec_logs_updated_at
  BEFORE UPDATE ON public.spec_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_spec_log_comments_updated_at
  BEFORE UPDATE ON public.spec_log_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.spec_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spec_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spec_log_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spec_log_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spec_log_reactions ENABLE ROW LEVEL SECURITY;

-- spec_events policies (preneur + admin only for writes)
CREATE POLICY "spec_events_select" ON public.spec_events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "spec_events_insert" ON public.spec_events
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ANY(ARRAY['preneur', 'admin']::user_role[])
  ));

CREATE POLICY "spec_events_update" ON public.spec_events
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ANY(ARRAY['preneur', 'admin']::user_role[])
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ANY(ARRAY['preneur', 'admin']::user_role[])
  ));

CREATE POLICY "spec_events_delete" ON public.spec_events
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ANY(ARRAY['preneur', 'admin']::user_role[])
  ));

-- spec_logs policies (learner+ for writes, author/admin for delete)
CREATE POLICY "spec_logs_select" ON public.spec_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "spec_logs_insert" ON public.spec_logs
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ANY(ARRAY['learner', 'preneur', 'admin']::user_role[])
  ));

CREATE POLICY "spec_logs_update" ON public.spec_logs
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "spec_logs_delete" ON public.spec_logs
  FOR DELETE TO authenticated
  USING (
    author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role)
  );

-- spec_log_images policies (tied to log ownership)
CREATE POLICY "spec_log_images_select" ON public.spec_log_images
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "spec_log_images_insert" ON public.spec_log_images
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.spec_logs WHERE id = log_id AND author_id = auth.uid()
  ));

CREATE POLICY "spec_log_images_delete" ON public.spec_log_images
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.spec_logs WHERE id = log_id AND (
      author_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role)
    )
  ));

-- spec_log_comments policies (learner+ for writes, author/admin for delete)
CREATE POLICY "spec_log_comments_select" ON public.spec_log_comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "spec_log_comments_insert" ON public.spec_log_comments
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ANY(ARRAY['learner', 'preneur', 'admin']::user_role[])
  ));

CREATE POLICY "spec_log_comments_update" ON public.spec_log_comments
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "spec_log_comments_delete" ON public.spec_log_comments
  FOR DELETE TO authenticated
  USING (
    author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role)
  );

-- spec_log_reactions policies (learner+ for writes, own only for delete)
CREATE POLICY "spec_log_reactions_select" ON public.spec_log_reactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "spec_log_reactions_insert" ON public.spec_log_reactions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ANY(ARRAY['learner', 'preneur', 'admin']::user_role[])
  ));

CREATE POLICY "spec_log_reactions_delete" ON public.spec_log_reactions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
