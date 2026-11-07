alter table generated_content add column if not exists usage jsonb;

create table if not exists model_rate (
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

grant select on model_rate to anon, authenticated;
