create table if not exists generation_lock (
  user_id uuid primary key references auth.users (id) on delete cascade,
  acquired_at timestamptz not null default now()
);

alter table generation_lock enable row level security;

drop policy if exists generation_lock_select on generation_lock;
create policy generation_lock_select on generation_lock
  for select using (auth.uid() = user_id);

drop policy if exists generation_lock_insert on generation_lock;
create policy generation_lock_insert on generation_lock
  for insert with check (auth.uid() = user_id);

drop policy if exists generation_lock_delete on generation_lock;
create policy generation_lock_delete on generation_lock
  for delete using (auth.uid() = user_id);

grant select, insert, delete on generation_lock to authenticated;

revoke update on generation_lock from anon, authenticated;
