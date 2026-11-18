
import assert from "node:assert/strict";
import test from "node:test";
import {
  IMAGE_MIME,
  IMAGE_PROMPT_MAX,
  imageDataUrl,
  parseImagePrompt,
} from "./image.ts";

test("a usable prompt is trimmed and accepted", () => {
  assert.deepEqual(parseImagePrompt("  A coffee cup on a table  "), {
    ok: true,
    value: "A coffee cup on a table",
  });
});

test("a missing or blank prompt is refused", () => {
  assert.equal(parseImagePrompt(undefined).ok, false);
  assert.equal(parseImagePrompt("   ").ok, false);
  assert.equal(parseImagePrompt(42).ok, false);
});

test("the prompt limit is inclusive", () => {
  assert.equal(parseImagePrompt("a".repeat(IMAGE_PROMPT_MAX)).ok, true);
  assert.equal(parseImagePrompt("a".repeat(IMAGE_PROMPT_MAX + 1)).ok, false);
});

test("the data URL names the type the browser is handed", () => {
  assert.equal(imageDataUrl("abc123"), `data:${IMAGE_MIME};base64,abc123`);
  assert.throws(() => imageDataUrl(""));
});
