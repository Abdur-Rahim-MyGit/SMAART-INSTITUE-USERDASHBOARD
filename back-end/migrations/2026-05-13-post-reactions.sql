CREATE TABLE IF NOT EXISTS post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (
    reaction_type IN ('like', 'heart', 'insightful', 'support')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id
  ON post_reactions (post_id);

CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id
  ON post_reactions (user_id);
