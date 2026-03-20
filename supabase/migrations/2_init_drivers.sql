create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  phone_masked text,
  vehicle_type text,
  vehicle_note text,
  status text not null default 'active',
  dispatch_enabled boolean not null default true,
  base_region text,
  current_region text,
  current_lat numeric default 0,
  current_lng numeric default 0,
  rating numeric(3,2) default 5.00,
  response_score integer default 0,
  acceptance_rate numeric(5,2) default 0,
  completion_rate numeric(5,2) default 0,
  cancel_rate numeric(5,2) default 0,
  total_jobs integer not null default 0,
  completed_jobs integer not null default 0,
  canceled_jobs integer not null default 0,
  bank_name text,
  bank_account text,
  account_holder text,
  internal_memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table jobs
  drop constraint if exists jobs_assigned_driver_id_fkey,
  add constraint jobs_assigned_driver_id_fkey foreign key (assigned_driver_id) references drivers(id);
