alter table if exists jobs
  add column if not exists customer_complete_token text unique,
  add column if not exists customer_cancel_token text unique,
  add column if not exists customer_completed_at timestamptz,
  add column if not exists customer_completion_note text,
  add column if not exists customer_canceled_at timestamptz,
  add column if not exists customer_cancel_note text;

create index if not exists idx_jobs_customer_complete_token
  on jobs(customer_complete_token);

create index if not exists idx_jobs_customer_cancel_token
  on jobs(customer_cancel_token);
