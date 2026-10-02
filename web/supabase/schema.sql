create type content_kind as enum ('blog_outline', 'social_caption', 'email_newsletter');
create type brand_voice as enum ('professional', 'casual', 'friendly');

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
  created_at timestamptz not null default now(),
  constraint generated_content_rating_range check (rating is null or rating between 1 and 5)
);

create index generated_content_user_created_idx
  on generated_content (user_id, created_at desc);

alter table business_profile enable row level security;
alter table generated_content enable row level security;

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
