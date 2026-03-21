create table if not exists ad_channel_daily (
  id uuid primary key default gen_random_uuid(),
  metric_date date not null,
  channel text not null,
  spend_amount integer not null default 0,
  lead_sent_count integer not null default 0,
  lead_read_count integer not null default 0,
  refund_count integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(metric_date, channel)
);

create table if not exists pricing_state (
  key text primary key,
  current_multiplier numeric(8,3) not null default 0.714,
  display_multiplier numeric(8,3) not null default 1,
  mode text not null default 'auto',
  min_multiplier numeric(8,3) not null default 0.620,
  max_multiplier numeric(8,3) not null default 0.900,
  adjust_step_small numeric(8,3) not null default 0.020,
  adjust_step_large numeric(8,3) not null default 0.040,
  last_reason text,
  last_metrics jsonb,
  last_evaluated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pricing_adjustments (
  id uuid primary key default gen_random_uuid(),
  state_key text not null references pricing_state(key) on delete cascade,
  previous_multiplier numeric(8,3) not null,
  next_multiplier numeric(8,3) not null,
  change_amount numeric(8,3) not null default 0,
  reason text,
  metrics jsonb,
  created_by text not null default 'system',
  created_at timestamptz not null default now()
);

alter table if exists jobs
  add column if not exists acquisition_source text,
  add column if not exists acquisition_medium text,
  add column if not exists acquisition_campaign text;

create index if not exists idx_ad_channel_daily_date_channel
  on ad_channel_daily(metric_date desc, channel);

create index if not exists idx_jobs_acquisition_source
  on jobs(acquisition_source);

insert into pricing_state (key)
values ('default')
on conflict (key) do nothing;
