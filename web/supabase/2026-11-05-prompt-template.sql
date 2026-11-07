alter table generated_content add column if not exists prompt_version text;

create table if not exists prompt_template (
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

create unique index if not exists prompt_template_one_active_idx
  on prompt_template (content_type)
  where is_active;

alter table prompt_template enable row level security;

drop policy if exists prompt_template_select on prompt_template;
create policy prompt_template_select on prompt_template
  for select to authenticated using (true);

grant select on prompt_template to authenticated;

revoke insert, update, delete on prompt_template from anon, authenticated;
