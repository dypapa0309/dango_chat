create table if not exists dispatch_logs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  assignment_id uuid references assignments(id) on delete cascade,
  driver_id uuid references drivers(id),
  event_type text not null,
  actor_type text not null,
  actor_id text,
  actor_name text,
  prev_status text,
  next_status text,
  message text,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
