import test from "node:test";
import assert from "node:assert/strict";
import { assertInRange, InvariantError, invariant } from "./assert.ts";

test("invariant passes a truthy condition", () => {
  assert.doesNotThrow(() => invariant(1 === 1, "never fires"));
});

test("invariant throws InvariantError carrying the detail", () => {
  assert.throws(
    () => invariant(false, "topic is empty"),
    (error: unknown) =>
      error instanceof InvariantError && error.detail === "topic is empty",
  );
});

test("invariant refuses an empty description", () => {
  assert.throws(() => invariant(false, ""), InvariantError);
});

test("invariant narrows types", () => {
  const value: string | null = "present";
  invariant(value !== null, "value is present");
  assert.equal(value.length, 7);
});

test("assertInRange accepts the boundaries", () => {
  assert.doesNotThrow(() => assertInRange(0, 0, 1, "score"));
  assert.doesNotThrow(() => assertInRange(1, 0, 1, "score"));
  assert.doesNotThrow(() => assertInRange(0.5, 0, 1, "score"));
});

test("assertInRange rejects outside and non-finite values", () => {
  assert.throws(() => assertInRange(1.1, 0, 1, "score"), InvariantError);
  assert.throws(() => assertInRange(-0.1, 0, 1, "score"), InvariantError);
  assert.throws(() => assertInRange(Number.NaN, 0, 1, "score"), InvariantError);
  assert.throws(() => assertInRange(Number.POSITIVE_INFINITY, 0, 1, "score"), InvariantError);
});
