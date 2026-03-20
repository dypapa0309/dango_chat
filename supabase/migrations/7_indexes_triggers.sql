create index if not exists idx_jobs_status on jobs(status);
create index if not exists idx_jobs_dispatch_status on jobs(dispatch_status);
create index if not exists idx_assignments_job_id on assignments(job_id);
create index if not exists idx_assignments_status on assignments(status);
create index if not exists idx_assignments_expires_at on assignments(expires_at);
create index if not exists idx_dispatch_logs_job_id on dispatch_logs(job_id);
create index if not exists idx_payments_job_id on payments(job_id);
create index if not exists idx_settlements_job_id on settlements(job_id);

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_jobs_updated_at on jobs;
create trigger trg_jobs_updated_at before update on jobs for each row execute procedure update_updated_at_column();

drop trigger if exists trg_drivers_updated_at on drivers;
create trigger trg_drivers_updated_at before update on drivers for each row execute procedure update_updated_at_column();

drop trigger if exists trg_assignments_updated_at on assignments;
create trigger trg_assignments_updated_at before update on assignments for each row execute procedure update_updated_at_column();

drop trigger if exists trg_dispatch_logs_updated_at on dispatch_logs;
create trigger trg_dispatch_logs_updated_at before update on dispatch_logs for each row execute procedure update_updated_at_column();

drop trigger if exists trg_payments_updated_at on payments;
create trigger trg_payments_updated_at before update on payments for each row execute procedure update_updated_at_column();

drop trigger if exists trg_settlements_updated_at on settlements;
create trigger trg_settlements_updated_at before update on settlements for each row execute procedure update_updated_at_column();
