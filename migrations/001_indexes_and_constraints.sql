-- ============================================================
-- 001_indexes_and_constraints.sql
-- Supabase SQL Editor에서 실행하세요.
-- 각 블록은 독립적으로 실행 가능합니다.
-- ============================================================

-- ----------------------------------------------------------
-- INDEXES: jobs
-- ----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_jobs_created_at        ON jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_status            ON jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_service_type      ON jobs (service_type);
CREATE INDEX IF NOT EXISTS idx_jobs_customer_phone    ON jobs (customer_phone);
CREATE INDEX IF NOT EXISTS idx_jobs_move_date         ON jobs (move_date);
CREATE INDEX IF NOT EXISTS idx_jobs_archived_at       ON jobs (archived_at) WHERE archived_at IS NULL;

-- ----------------------------------------------------------
-- UNIQUE CONSTRAINT: job_no
-- 주의: 기존에 중복 job_no가 있으면 먼저 정리 필요
-- ----------------------------------------------------------
ALTER TABLE jobs
  ADD CONSTRAINT jobs_job_no_unique UNIQUE (job_no);

-- ----------------------------------------------------------
-- INDEXES: drivers
-- ----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_drivers_status          ON drivers (status);
CREATE INDEX IF NOT EXISTS idx_drivers_dispatch_enabled ON drivers (dispatch_enabled) WHERE dispatch_enabled = true;
CREATE INDEX IF NOT EXISTS idx_drivers_current_region  ON drivers (current_region);

-- ----------------------------------------------------------
-- INDEXES: assignments
-- ----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_assignments_job_id       ON assignments (job_id);
CREATE INDEX IF NOT EXISTS idx_assignments_driver_id    ON assignments (driver_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status       ON assignments (status);
CREATE INDEX IF NOT EXISTS idx_assignments_dispatch_token ON assignments (dispatch_token);
CREATE INDEX IF NOT EXISTS idx_assignments_active       ON assignments (job_id, status)
  WHERE status IN ('requested', 'accepted');

-- UNIQUE: 한 job에 accepted 상태 assignment는 최대 1개
-- (동시 배차 방지 - 이미 accepted인 경우 INSERT 차단)
CREATE UNIQUE INDEX IF NOT EXISTS idx_assignments_one_accepted_per_job
  ON assignments (job_id)
  WHERE status = 'accepted';

-- ----------------------------------------------------------
-- INDEXES: settlements
-- ----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_settlements_status     ON settlements (status);
CREATE INDEX IF NOT EXISTS idx_settlements_driver_id  ON settlements (driver_id);
CREATE INDEX IF NOT EXISTS idx_settlements_job_id     ON settlements (job_id);
CREATE INDEX IF NOT EXISTS idx_settlements_payout_key ON settlements (payout_period_key);

-- ----------------------------------------------------------
-- INDEXES: payments
-- ----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_payments_job_id          ON payments (job_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_key ON payments (transaction_key)
  WHERE transaction_key IS NOT NULL;

-- UNIQUE: transaction_key 중복 결제 방지 (recordPayment dedup 지원)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_transaction_key_unique
  ON payments (transaction_key)
  WHERE transaction_key IS NOT NULL;

-- ----------------------------------------------------------
-- INDEXES: dispatch_logs
-- ----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_dispatch_logs_job_id       ON dispatch_logs (job_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_logs_driver_id    ON dispatch_logs (driver_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_logs_created_at   ON dispatch_logs (created_at DESC);

-- CASCADE DELETE: job 삭제 시 dispatch_logs 자동 삭제
-- 주의: 기존 FK가 있으면 먼저 DROP 후 재생성
ALTER TABLE dispatch_logs
  DROP CONSTRAINT IF EXISTS dispatch_logs_job_id_fkey;

ALTER TABLE dispatch_logs
  ADD CONSTRAINT dispatch_logs_job_id_fkey
    FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE;

-- ----------------------------------------------------------
-- OPTIONAL: ad_channel_daily 복합 UNIQUE (upsert 지원)
-- ----------------------------------------------------------
ALTER TABLE ad_channel_daily
  ADD CONSTRAINT ad_channel_daily_date_channel_unique
    UNIQUE (metric_date, channel);
