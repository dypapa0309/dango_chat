alter table if exists drivers
  add column if not exists bank_name text,
  add column if not exists account_number text,
  add column if not exists account_holder text,
  add column if not exists payout_enabled boolean not null default false,
  add column if not exists payout_note text;

alter table if exists settlements
  add column if not exists payout_period_key text,
  add column if not exists payout_period_start date,
  add column if not exists payout_period_end date,
  add column if not exists payout_batch_key text,
  add column if not exists paid_by text,
  add column if not exists payout_memo text;

create index if not exists idx_settlements_driver_status_period
  on settlements(driver_id, status, payout_period_key);
