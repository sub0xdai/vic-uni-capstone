import assert from "node:assert/strict";
import test from "node:test";
import { parseRatingRequest } from "./rating.ts";

const ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

test("a draft id with a whole-number rating from 1 to 5 is accepted", () => {
  for (const rating of [1, 2, 3, 4, 5]) {
    assert.deepEqual(parseRatingRequest({ id: ID, rating }), {
      ok: true,
      value: { id: ID, rating },
    });
  }
});

test("a rating outside 1 to 5 is refused", () => {
  assert.equal(parseRatingRequest({ id: ID, rating: 0 }).ok, false);
  assert.equal(parseRatingRequest({ id: ID, rating: 6 }).ok, false);
  assert.equal(parseRatingRequest({ id: ID, rating: -1 }).ok, false);
});

test("a rating that is not a whole number is refused", () => {
  assert.equal(parseRatingRequest({ id: ID, rating: 3.5 }).ok, false);
  assert.equal(parseRatingRequest({ id: ID, rating: "4" }).ok, false);
  assert.equal(parseRatingRequest({ id: ID, rating: null }).ok, false);
  assert.equal(parseRatingRequest({ id: ID }).ok, false);
});

test("a missing or malformed draft id is refused", () => {
  assert.equal(parseRatingRequest({ rating: 4 }).ok, false);
  assert.equal(parseRatingRequest({ id: "not-an-id", rating: 4 }).ok, false);
  assert.equal(parseRatingRequest({ id: 42, rating: 4 }).ok, false);
});

test("a body that is not an object is refused", () => {
  assert.equal(parseRatingRequest(null).ok, false);
  assert.equal(parseRatingRequest("4").ok, false);
  assert.equal(parseRatingRequest([ID, 4]).ok, false);
});