alter table if exists drivers
  add column if not exists join_token uuid default gen_random_uuid(),
  add column if not exists vehicle_number text,
  add column if not exists commercial_plate_confirmed boolean not null default false,
  add column if not exists consign_contract_agreed boolean not null default false,
  add column if not exists consign_contract_version text,
  add column if not exists consign_contract_accepted_at timestamptz;

update drivers
set join_token = gen_random_uuid()
where join_token is null;

create unique index if not exists idx_drivers_join_token
  on drivers(join_token);
