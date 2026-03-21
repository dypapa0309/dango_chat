alter table if exists ad_channel_daily
  drop constraint if exists ad_channel_daily_metric_date_channel_key;

create unique index if not exists idx_payments_full_payment_transaction_key
  on payments(transaction_key)
  where payment_type = 'full_payment' and transaction_key is not null;
