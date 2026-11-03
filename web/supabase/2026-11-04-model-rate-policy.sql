alter table model_rate enable row level security;

drop policy if exists model_rate_select on model_rate;
create policy model_rate_select on model_rate
  for select to anon, authenticated using (true);

revoke insert, update, delete on model_rate from anon, authenticated;
