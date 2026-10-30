import test from "node:test";
import assert from "node:assert/strict";
import { extractGeminiText, geminiBody, geminiUrl } from "./gemini.ts";

test("extractGeminiText joins the text parts", () => {
  const result = extractGeminiText({
    candidates: [{ content: { parts: [{ text: "Hello " }, { text: "world" }] } }],
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value, "Hello world");
  }
});

test("extractGeminiText skips thought parts", () => {
  const result = extractGeminiText({
    candidates: [
      { content: { parts: [{ text: "thinking...", thought: true }, { text: "Answer" }] } },
    ],
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value, "Answer");
  }
});

test("extractGeminiText refuses a response with no candidates", () => {
  assert.equal(extractGeminiText({ candidates: [] }).ok, false);
  assert.equal(extractGeminiText(null).ok, false);
  assert.equal(extractGeminiText({}).ok, false);
});

test("extractGeminiText refuses empty text", () => {
  const result = extractGeminiText({
    candidates: [{ content: { parts: [{ text: "   " }] } }],
  });
  assert.equal(result.ok, false);
});

test("geminiUrl encodes the model name", () => {
  assert.match(geminiUrl("my model"), /models\/my%20model:generateContent$/);
});

test("geminiBody carries both prompts and the temperature", () => {
  const body = geminiBody("system text", "user text", 0.5);
  assert.equal(body.systemInstruction.parts[0]?.text, "system text");
  assert.equal(body.contents[0]?.parts[0]?.text, "user text");
  assert.equal(body.generationConfig.temperature, 0.5);
});