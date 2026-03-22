alter table if exists drivers
  add column if not exists tax_name text,
  add column if not exists tax_birth_date date,
  add column if not exists tax_id_number text,
  add column if not exists tax_email text,
  add column if not exists tax_address text,
  add column if not exists tax_withholding_type text not null default 'freelancer_3_3',
  add column if not exists tax_withholding_agreed boolean not null default false;
