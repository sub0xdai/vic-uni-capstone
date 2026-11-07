import { invariant } from "./assert.ts";
import type { Draft, ModelRate, TokenUsage } from "./types.ts";

export type Spend = {
  tokens: TokenUsage;
  cost: number | null;
};

export function costOf(usage: TokenUsage, rate: ModelRate): number {
  invariant(usage.inputTokens >= 0 && usage.outputTokens >= 0, "token counts went negative");
  invariant(rate.inputPerMillion >= 0 && rate.outputPerMillion >= 0, "a rate went negative");
  const input = (usage.inputTokens / 1_000_000) * rate.inputPerMillion;
  const output = (usage.outputTokens / 1_000_000) * rate.outputPerMillion;
  invariant(Number.isFinite(input) && Number.isFinite(output), "cost is not a finite number");
  return input + output;
}

export function rateFor(model: string, rates: ModelRate[]): ModelRate | null {
  invariant(model.length > 0, "rateFor called without a model");
  return rates.find((rate) => rate.model === model) ?? null;
}

function sameMonth(iso: string, now: Date): boolean {
  const date = new Date(iso);
  invariant(!Number.isNaN(date.getTime()), `draft has an unreadable date: ${iso}`);
  return (
    date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() === now.getUTCMonth()
  );
}

export function monthlySpend(drafts: Draft[], rates: ModelRate[], now: Date): Spend {
  invariant(Array.isArray(drafts), "drafts is not an array");
  invariant(Array.isArray(rates), "rates is not an array");
  let inputTokens = 0;
  let outputTokens = 0;
  let cost = 0;
  let priced = false;

  for (const draft of drafts) {
    if (draft.usage === null || !sameMonth(draft.createdAt, now)) {
      continue;
    }
    inputTokens += draft.usage.inputTokens;
    outputTokens += draft.usage.outputTokens;
    const model = draft.parameters === null ? null : draft.parameters.model;
    const rate = model === null ? null : rateFor(model, rates);
    if (rate === null) {
      continue;
    }
    cost += costOf(draft.usage, rate);
    priced = true;
  }

  invariant(inputTokens >= 0 && outputTokens >= 0, "usage totals went negative");
  return { tokens: { inputTokens, outputTokens }, cost: priced ? cost : null };
}
