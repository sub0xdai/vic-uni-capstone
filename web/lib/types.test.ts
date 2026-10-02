import test from "node:test";
import assert from "node:assert/strict";
import {
  BRAND_TONE_LABELS,
  BRAND_TONES,
  CONTENT_TYPE_LABELS,
  CONTENT_TYPES,
  isBrandTone,
  isContentType,
  parseBrandTone,
  parseContentType,
  parseGenerationRequest,
  parseRating,
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

test("every closed set member has a label", () => {
  for (const value of CONTENT_TYPES) {
    assert.equal(typeof CONTENT_TYPE_LABELS[value], "string", `no label for ${value}`);
  }
  for (const value of BRAND_TONES) {
    assert.equal(typeof BRAND_TONE_LABELS[value], "string", `no label for ${value}`);
  }
  assert.equal(Object.keys(CONTENT_TYPE_LABELS).length, CONTENT_TYPES.length);
  assert.equal(Object.keys(BRAND_TONE_LABELS).length, BRAND_TONES.length);
});

test("rejects unknown values from a boundary", () => {
  assert.equal(parseContentType("tweet").ok, false);
  assert.equal(parseBrandTone(3).ok, false);
  assert.equal(parseRating(0).ok, false);
  assert.equal(parseRating(6).ok, false);
  assert.equal(parseRating(3.5).ok, false);
});

test("accepts valid values from a boundary", () => {
  assert.deepEqual(parseContentType("blog_outline"), { ok: true, value: "blog_outline" });
  assert.deepEqual(parseRating(4), { ok: true, value: 4 });
});

test("a generation request is parsed and normalised at the boundary", () => {
  const parsed = parseGenerationRequest({
    contentType: "social_caption",
    topic: "  Single origin launch  ",
    keywords: [" Ethiopia ", "", "single origin"],
  });
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.ok && parsed.value, {
    contentType: "social_caption",
    topic: "Single origin launch",
    keywords: ["Ethiopia", "single origin"],
  });
});

test("a malformed generation request is refused", () => {
  assert.equal(parseGenerationRequest(null).ok, false);
  assert.equal(parseGenerationRequest({}).ok, false);
  assert.equal(parseGenerationRequest({ contentType: "tweet", topic: "x" }).ok, false);
  assert.equal(parseGenerationRequest({ contentType: "blog_outline", topic: "   " }).ok, false);
  assert.equal(
    parseGenerationRequest({ contentType: "blog_outline", topic: "x", keywords: "y" }).ok,
    false,
  );
  assert.equal(
    parseGenerationRequest({ contentType: "blog_outline", topic: "x", keywords: [1] }).ok,
    false,
  );
});
