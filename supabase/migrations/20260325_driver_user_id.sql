-- ============================================================
-- drivers 테이블에 user_id 추가 (Supabase Auth 연동)
-- 전문가 OAuth 로그인과 기사 레코드 연결
-- ============================================================
ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id) WHERE user_id IS NOT NULL;
