-- User preferences: saved addresses and service preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  saved_addresses JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own preferences
CREATE POLICY "own_preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Service role has full access (for server-side upserts)
CREATE POLICY "service_role_all" ON user_preferences
  FOR ALL TO service_role USING (true) WITH CHECK (true);
