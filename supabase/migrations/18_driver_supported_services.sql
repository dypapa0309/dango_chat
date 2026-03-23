alter table if exists drivers
  add column if not exists supported_services text[] not null default array['move']::text[];

update drivers
set supported_services = array_remove(array[
  case when coalesce(supports_move, true) then 'move' else null end,
  case when coalesce(supports_clean, false) then 'clean' else null end,
  case when coalesce(supports_yd, false) then 'yd' else null end
], null)
where supported_services is null
   or coalesce(array_length(supported_services, 1), 0) = 0;

create index if not exists idx_drivers_supported_services
  on drivers using gin (supported_services);
