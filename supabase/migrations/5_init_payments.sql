create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  payment_type text not null,
  method text,
  status text not null default 'pending',
  amount integer not null default 0,
  transaction_key text,
  paid_at timestamptz,
  failed_at timestamptz,
  refunded_at timestamptz,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
