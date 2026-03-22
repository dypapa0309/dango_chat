alter table if exists settlements
  add column if not exists withholding_rate numeric(6,5) not null default 0.033,
  add column if not exists withholding_amount integer not null default 0,
  add column if not exists net_amount integer not null default 0;

update settlements
set
  withholding_rate = 0.033,
  withholding_amount = round(coalesce(amount, 0) * 0.033),
  net_amount = greatest(coalesce(amount, 0) - round(coalesce(amount, 0) * 0.033), 0)
where coalesce(amount, 0) > 0;
