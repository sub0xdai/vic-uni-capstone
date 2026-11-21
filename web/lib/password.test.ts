import test from "node:test";
import assert from "node:assert/strict";
import { MIN_LENGTH, passwordProblem } from "./password.ts";

test("a password one character short is refused with the minimum in the message", () => {
  assert.equal(
    passwordProblem("a".repeat(MIN_LENGTH - 1)),
    `Use at least ${MIN_LENGTH} characters for the password.`,
  );
});

test("a password at the minimum length is accepted", () => {
  assert.equal(passwordProblem("a".repeat(MIN_LENGTH)), null);
});

test("an empty password is refused", () => {
  assert.notEqual(passwordProblem(""), null);
});
