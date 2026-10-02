import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { BRAND_TONES, CONTENT_TYPES } from "./types.ts";

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
