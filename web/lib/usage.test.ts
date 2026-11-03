import assert from "node:assert/strict";
import test from "node:test";
import { costOf, monthlySpend, rateFor } from "./usage.ts";
import type { Draft, ModelRate } from "./types.ts";

const RATE: ModelRate = { model: "test-model", inputPerMillion: 0.5, outputPerMillion: 2 };

function draft(overrides: Partial<Draft>): Draft {
  return {
    id: "d",
    userId: "u",
    contentType: "social_caption",
    topic: "t",
    keywords: [],
    contentText: "text",
    rating: null,
    status: "draft",
    statusChangedAt: null,
    analysis: null,
    parameters: { model: "test-model", temperature: 0.7, systemPrompt: "s", userPrompt: "u" },
    usage: { inputTokens: 100, outputTokens: 200 },
    createdAt: "2026-11-03T09:00:00.000Z",
    ...overrides,
  };
}

const NOW = new Date("2026-11-15T00:00:00.000Z");

test("a million input tokens costs the input rate", () => {
  assert.equal(costOf({ inputTokens: 1_000_000, outputTokens: 0 }, RATE), 0.5);
});

test("input and output are priced separately", () => {
  const cost = costOf({ inputTokens: 1_000_000, outputTokens: 1_000_000 }, RATE);
  assert.equal(cost, 2.5);
});

test("the rate lookup returns the row for the model, or nothing", () => {
  assert.equal(rateFor("test-model", [RATE]), RATE);
  assert.equal(rateFor("other-model", [RATE]), null);
});

test("spending counts only this month and only drafts with usage", () => {
  const spend = monthlySpend(
    [
      draft({}),
      draft({ id: "old", createdAt: "2026-10-31T23:00:00.000Z" }),
      draft({ id: "legacy", usage: null }),
    ],
    [RATE],
    NOW,
  );
  assert.deepEqual(spend.tokens, { inputTokens: 100, outputTokens: 200 });
  assert.ok(spend.cost !== null && Math.abs(spend.cost - 0.00045) < 1e-12);
});

test("a model with no rate row still reports tokens, and no cost", () => {
  const unpriced: Draft = draft({
    parameters: { model: "unpriced", temperature: 0, systemPrompt: "s", userPrompt: "u" },
  });
  const spend = monthlySpend([unpriced], [RATE], NOW);
  assert.deepEqual(spend.tokens, { inputTokens: 100, outputTokens: 200 });
  assert.equal(spend.cost, null);
});
