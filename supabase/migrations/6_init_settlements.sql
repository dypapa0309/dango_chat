create table if not exists settlements (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  driver_id uuid not null references drivers(id),
  status text not null default 'pending',
  amount integer not null default 0,
  approved_at timestamptz,
  paid_at timestamptz,
  held_at timestamptz,
  hold_reason text,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
