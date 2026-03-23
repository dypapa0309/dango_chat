alter table if exists drivers
  add column if not exists supports_move boolean not null default true,
  add column if not exists supports_clean boolean not null default false,
  add column if not exists supports_yd boolean not null default false;

alter table if exists jobs
  add column if not exists service_type text not null default 'move';

update drivers
set supports_move = true
where supports_move is null;

update jobs
set service_type = case
  when coalesce(service_type, '') <> '' then service_type
  when coalesce(option_summary->>'cleaning', 'false') = 'true' then 'clean'
  else 'move'
end;

create index if not exists idx_jobs_service_type on jobs(service_type);
