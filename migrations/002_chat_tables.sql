-- ============================================================
-- 002_chat_tables.sql
-- 당고 AI 채팅 테이블
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

-- ----------------------------------------------------------
-- conversations: 대화 목록
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        text NOT NULL DEFAULT '새 대화',
  service_type text,
  job_id       uuid,
  state        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id    ON conversations (user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations (updated_at DESC);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations: users manage own" ON conversations
  FOR ALL USING (auth.uid() = user_id);

-- ----------------------------------------------------------
-- messages: 메시지
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id   uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role              text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content           text NOT NULL DEFAULT '',
  card              jsonb,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at      ON messages (created_at ASC);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages: users manage via conversations" ON messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND conversations.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------
-- ai_usage_logs: AI 토큰 사용량 추적 (선택)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id     uuid REFERENCES conversations(id) ON DELETE SET NULL,
  model               text,
  input_tokens        int,
  output_tokens       int,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- updated_at auto-update trigger for conversations
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS conversations_updated_at ON conversations;
CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
