-- ============================================================
-- jobs 테이블에 user_id 추가 (Supabase Auth 연동)
-- 로그인 고객의 주문을 계정과 연결
-- ============================================================
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id) WHERE user_id IS NOT NULL;
