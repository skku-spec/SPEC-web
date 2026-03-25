ALTER TABLE public.members RENAME COLUMN runner_batch TO learner_batch;
ALTER INDEX IF EXISTS idx_members_runner_batch RENAME TO idx_members_learner_batch;

-- ROLLBACK:
-- ALTER TABLE public.members RENAME COLUMN learner_batch TO runner_batch;
-- ALTER INDEX IF EXISTS idx_members_learner_batch RENAME TO idx_members_runner_batch;
