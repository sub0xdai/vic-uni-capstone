import test from "node:test";
import assert from "node:assert/strict";
import { confirmReason, DASHBOARD, safeNext } from "./confirm.ts";

test("a known reason becomes a sentence", () => {
  assert.match(confirmReason("expired") ?? "", /expired/);
});

test("no reason stays silent", () => {
  assert.equal(confirmReason(null), null);
});

test("an unknown reason stays silent", () => {
  assert.equal(confirmReason("nonsense"), null);
});

test("no next value falls back to the dashboard", () => {
  assert.equal(safeNext(null), DASHBOARD);
});

test("a path on this site is kept", () => {
  assert.equal(safeNext("/reset-password"), "/reset-password");
});

test("a protocol-relative address is refused", () => {
  assert.equal(safeNext("//evil.example"), DASHBOARD);
  assert.equal(safeNext("/\\evil.example"), DASHBOARD);
});

test("a full address is refused", () => {
  assert.equal(safeNext("https://evil.example"), DASHBOARD);
  assert.equal(safeNext("evil.example"), DASHBOARD);
});
