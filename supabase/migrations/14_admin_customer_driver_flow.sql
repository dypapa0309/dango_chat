alter table if exists jobs
  add column if not exists driver_departed_at timestamptz,
  add column if not exists driver_arrived_at timestamptz,
  add column if not exists work_started_at timestamptz,
  add column if not exists driver_completion_requested_at timestamptz;

create index if not exists idx_jobs_customer_lookup
  on jobs(customer_phone, customer_name, created_at desc);
