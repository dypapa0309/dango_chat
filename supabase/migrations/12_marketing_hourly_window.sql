alter table if exists ad_channel_daily
  add column if not exists metric_at timestamptz;

update ad_channel_daily
set metric_at = coalesce(metric_at, metric_date::timestamptz, created_at, now())
where metric_at is null;

alter table if exists ad_channel_daily
  alter column metric_at set not null;

drop index if exists idx_ad_channel_daily_date_channel;
create index if not exists idx_ad_channel_daily_metric_at_channel
  on ad_channel_daily(metric_at desc, channel);
