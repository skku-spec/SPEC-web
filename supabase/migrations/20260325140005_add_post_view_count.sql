-- Add view_count column to posts table for tracking article views
ALTER TABLE posts ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

-- Index for sorting by popularity
CREATE INDEX IF NOT EXISTS idx_posts_view_count ON posts (view_count DESC);

-- RPC function to atomically increment view count (avoids race conditions)
CREATE OR REPLACE FUNCTION increment_post_view_count(post_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE posts SET view_count = view_count + 1 WHERE id = post_id;
$$;
