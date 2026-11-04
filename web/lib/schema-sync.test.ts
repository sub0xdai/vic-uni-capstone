import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { BRAND_TONES, CONTENT_TYPES, DRAFT_STATUSES } from "./types.ts";

const SQL = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");

function enumValues(typeName: string): string[] {
  const match = SQL.match(new RegExp(`create type ${typeName} as enum \\(([^)]*)\\)`));
  assert.ok(match, `enum ${typeName} is missing from supabase/schema.sql`);
  return match[1]
    .split(",")
    .map((item) => item.trim().replace(/^'|'$/g, ""))
    .filter((item) => item.length > 0)
    .sort();
}

test("content_kind matches CONTENT_TYPES", () => {
  assert.deepEqual(enumValues("content_kind"), [...CONTENT_TYPES].sort());
});

test("brand_voice matches BRAND_TONES", () => {
  assert.deepEqual(enumValues("brand_voice"), [...BRAND_TONES].sort());
});

test("content_status matches DRAFT_STATUSES", () => {
  assert.deepEqual(enumValues("content_status"), [...DRAFT_STATUSES].sort());
});

test("generated_content has a status column that defaults to draft", () => {
  assert.match(SQL, /status content_status not null default 'draft'/);
});

test("every content column is not null", () => {
  assert.match(SQL, /content_type content_kind not null/);
  assert.match(SQL, /model text not null/);
  assert.match(SQL, /temperature numeric not null/);
  assert.match(SQL, /system_prompt text not null/);
  assert.match(SQL, /user_prompt text not null/);
});

test("tenancy is enforced on insert", () => {
  const guards = SQL.match(/with check \(auth\.uid\(\) = user_id\)/g) ?? [];
  assert.ok(guards.length >= 4, `expected insert and update guards, found ${guards.length}`);
});

test("model_rate is readable by clients and writable by nobody", () => {
  assert.match(SQL, /alter table model_rate enable row level security/);
  assert.match(
    SQL,
    /create policy model_rate_select on model_rate\s+for select to anon, authenticated\s+using/,
  );
  assert.match(SQL, /grant select on model_rate to anon, authenticated/);
  assert.doesNotMatch(SQL, /grant all on all tables|alter default privileges/);
});

test("prompt_template is readable by signed in clients and writable by nobody", () => {
  assert.match(SQL, /alter table prompt_template enable row level security/);
  assert.match(
    SQL,
    /create policy prompt_template_select on prompt_template\s+for select to authenticated\s+using/,
  );
  assert.match(SQL, /grant select on prompt_template to authenticated/);
  assert.doesNotMatch(SQL, /grant (insert|update|delete)[^;]*prompt_template/);
});

test("a draft records the prompt version that produced it", () => {
  assert.match(SQL, /prompt_version text/);
});

test("only one template per content type can be active", () => {
  assert.match(SQL, /create unique index prompt_template_one_active_idx[^;]*where is_active/);
});