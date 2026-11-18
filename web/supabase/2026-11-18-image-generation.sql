
create table image_generation_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  used smallint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, day),
  constraint image_generation_usage_non_negative check (used >= 0)
);

alter table image_generation_usage enable row level security;

create policy image_generation_usage_select on image_generation_usage
  for select to authenticated using (auth.uid() = user_id);

grant select on image_generation_usage to authenticated;

create or replace function consume_image_generation()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  daily_limit constant integer := 3;
  remaining smallint;
begin
  if auth.uid() is null then
    raise exception 'consume_image_generation needs a signed-in user';
  end if;

  insert into image_generation_usage (user_id, day, used)
  values (auth.uid(), (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day) do update
    set used = image_generation_usage.used + 1,
        updated_at = now()
    where image_generation_usage.used < daily_limit
  returning used into remaining;

  return remaining is not null;
end;
$$;

create or replace function refund_image_generation()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update image_generation_usage
     set used = greatest(used - 1, 0),
         updated_at = now()
   where user_id = auth.uid()
     and day = (now() at time zone 'utc')::date;
end;
$$;

revoke all on function consume_image_generation() from public, anon;
revoke all on function refund_image_generation() from public, anon;
grant execute on function consume_image_generation() to authenticated;
grant execute on function refund_image_generation() to authenticated;
