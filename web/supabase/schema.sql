create type content_kind as enum ('blog_outline', 'social_caption', 'email_newsletter');
create type brand_voice as enum ('professional', 'casual', 'friendly');
create type content_status as enum ('draft', 'published', 'discarded');

create table business_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  business_name text not null,
  industry text not null,
  description text not null,
  target_audience text not null,
  brand_tone brand_voice not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_profile_one_per_user unique (user_id)
);

create table generated_content (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content_type content_kind not null,
  topic text not null,
  keywords text[] not null default '{}',
  content_text text not null,
  rating smallint,
  analysis jsonb,
  status content_status not null default 'draft',
  status_changed_at timestamptz,
  model text not null,
  temperature numeric not null,
  system_prompt text not null,
  user_prompt text not null,
  prompt_version text,
  idempotency_key text,
  created_at timestamptz not null default now(),
  constraint generated_content_rating_range check (rating is null or rating between 1 and 5),
  constraint generated_content_temperature_range check (temperature >= 0 and temperature <= 2)
);

create index generated_content_user_created_idx
  on generated_content (user_id, created_at desc);

create unique index generated_content_idempotency_idx
  on generated_content (user_id, idempotency_key)
  where idempotency_key is not null;

create table model_rate (
  model text primary key,
  input_per_million numeric not null,
  output_per_million numeric not null,
  updated_at timestamptz not null default now(),
  constraint model_rate_price_range check (
    input_per_million >= 0 and output_per_million >= 0
  )
);

insert into model_rate (model, input_per_million, output_per_million)
values ('gemini-3.5-flash-lite', 0.10, 0.40)
on conflict (model) do nothing;

create table prompt_template (
  id uuid primary key default gen_random_uuid(),
  content_type content_kind not null,
  version integer not null,
  body text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  constraint prompt_template_version_unique unique (content_type, version),
  constraint prompt_template_version_positive check (version > 0),
  constraint prompt_template_body_present check (length(trim(body)) > 0)
);

create unique index prompt_template_one_active_idx
  on prompt_template (content_type)
  where is_active;

create table generation_lock (
  user_id uuid primary key references auth.users (id) on delete cascade,
  acquired_at timestamptz not null default now()
);

alter table business_profile enable row level security;
alter table generated_content enable row level security;
alter table model_rate enable row level security;
alter table prompt_template enable row level security;
alter table generation_lock enable row level security;

create policy business_profile_select on business_profile
  for select using (auth.uid() = user_id);
create policy business_profile_insert on business_profile
  for insert with check (auth.uid() = user_id);
create policy business_profile_update on business_profile
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy business_profile_delete on business_profile
  for delete using (auth.uid() = user_id);

create policy generated_content_select on generated_content
  for select using (auth.uid() = user_id);
create policy generated_content_insert on generated_content
  for insert with check (auth.uid() = user_id);
create policy generated_content_update on generated_content
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy generated_content_delete on generated_content
  for delete using (auth.uid() = user_id);

create policy model_rate_select on model_rate
  for select to anon, authenticated using (true);

create policy prompt_template_select on prompt_template
  for select to authenticated using (true);

create policy generation_lock_select on generation_lock
  for select using (auth.uid() = user_id);
create policy generation_lock_insert on generation_lock
  for insert with check (auth.uid() = user_id);
create policy generation_lock_delete on generation_lock
  for delete using (auth.uid() = user_id);

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger business_profile_touch
  before update on business_profile
  for each row execute function touch_updated_at();

grant usage on schema public to anon, authenticated;

grant select on business_profile, generated_content to anon;

grant select, insert, update, delete on business_profile to authenticated;
grant select, insert, update, delete on generated_content to authenticated;
grant select on model_rate to anon, authenticated;
grant select on prompt_template to authenticated;
grant select, insert, delete on generation_lock to authenticated;
