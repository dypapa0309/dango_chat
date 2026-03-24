-- ============================================================
-- 1. 고객 전문가 거절 플로우
--    jobs 테이블에 거절 횟수 + 거절 토큰 추가
-- ============================================================
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS customer_reject_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS customer_rejection_count INT DEFAULT 0;

-- 거절 토큰에 인덱스
CREATE INDEX IF NOT EXISTS idx_jobs_customer_reject_token ON jobs(customer_reject_token);

-- ============================================================
-- 2. 채팅 메시지 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'driver', 'system')),
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_job_id_created ON messages(job_id, created_at);
