-- Create ideathon_ideas table
CREATE TABLE public.ideathon_ideas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text NOT NULL,
  target_customer text,
  competitors     text,
  market_size     text,
  team_members    text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ideathon_ideas_user ON public.ideathon_ideas(user_id);
CREATE INDEX idx_ideathon_ideas_created ON public.ideathon_ideas(created_at DESC);

-- Enable RLS
ALTER TABLE public.ideathon_ideas ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "ideathon_ideas_select" ON public.ideathon_ideas
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "ideathon_ideas_insert" ON public.ideathon_ideas
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('learner', 'alumni', 'preneur')
    )
  );

CREATE POLICY "ideathon_ideas_update" ON public.ideathon_ideas
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "ideathon_ideas_delete" ON public.ideathon_ideas
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
  );

-- Trigger for set_updated_at
CREATE TRIGGER set_ideathon_ideas_updated_at
  BEFORE UPDATE ON public.ideathon_ideas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
