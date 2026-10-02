import test from "node:test";
import assert from "node:assert/strict";
import {
  BRAND_TONES,
  CONTENT_TYPES,
  isBrandTone,
  isContentType,
} from "./types.ts";

test("accepts every declared content type", () => {
  for (const value of CONTENT_TYPES) {
    assert.equal(isContentType(value), true);
  }
  assert.equal(isContentType("tweet"), false);
});

test("accepts every declared brand tone", () => {
  for (const value of BRAND_TONES) {
    assert.equal(isBrandTone(value), true);
  }
  assert.equal(isBrandTone("sarcastic"), false);
});
