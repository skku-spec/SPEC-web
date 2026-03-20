-- ============================================================
-- 023-homework-padlet-board-id.sql
-- Add padlet_board_id column to homeworks table
-- ============================================================

ALTER TABLE public.homeworks 
ADD COLUMN IF NOT EXISTS padlet_board_id TEXT;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
