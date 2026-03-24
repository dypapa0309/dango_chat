-- Phase 4: customer_email, disputes, receipts, driver availability

-- 1. Add customer_email to jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- 2. Disputes / CS ticket table
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  -- categories: general, refund, damage, no_show, complaint, other
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  -- statuses: open, in_progress, resolved, closed
  priority TEXT NOT NULL DEFAULT 'normal',
  -- priorities: low, normal, high, urgent
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disputes_job_id ON disputes(job_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes(created_at DESC);

-- 3. Driver availability schedule
CREATE TABLE IF NOT EXISTS driver_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(driver_id, date)
);

CREATE INDEX IF NOT EXISTS idx_driver_availability_driver_date ON driver_availability(driver_id, date);
