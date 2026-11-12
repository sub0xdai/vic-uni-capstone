import assert from "node:assert/strict";
import test from "node:test";
import { parseIdempotencyKey } from "./idempotency.ts";

test("a missing header is allowed and means no replay protection", () => {
  assert.deepEqual(parseIdempotencyKey(null), { ok: true, value: null });
  assert.deepEqual(parseIdempotencyKey("   "), { ok: true, value: null });
});

test("a well formed key is passed through unchanged", () => {
  assert.deepEqual(parseIdempotencyKey(" 7c9e6679-7425-40de-944b ".trim()), {
    ok: true,
    value: "7c9e6679-7425-40de-944b",
  });
  assert.deepEqual(parseIdempotencyKey("abcDEF123-_x"), {
    ok: true,
    value: "abcDEF123-_x",
  });
});

test("a malformed key is refused rather than silently ignored", () => {
  const short = parseIdempotencyKey("abc");
  assert.equal(short.ok, false);
  const spaced = parseIdempotencyKey("has spaces in it");
  assert.equal(spaced.ok, false);
  const long = parseIdempotencyKey("x".repeat(101));
  assert.equal(long.ok, false);
  const symbol = parseIdempotencyKey("bad$key$here");
  assert.equal(symbol.ok, false);
});
