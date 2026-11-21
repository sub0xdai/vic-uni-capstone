import test from "node:test";
import assert from "node:assert/strict";
import { confirmReason } from "./confirm.ts";

test("a known reason becomes a sentence", () => {
  assert.match(confirmReason("expired") ?? "", /expired/);
});

test("no reason stays silent", () => {
  assert.equal(confirmReason(null), null);
});

test("an unknown reason stays silent", () => {
  assert.equal(confirmReason("nonsense"), null);
});
