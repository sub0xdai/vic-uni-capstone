import { rescoreText } from "./evaluate.ts";
import type { BrandTone, Draft, QualityReport } from "./types.ts";

export type SaveOutcome =
  | { kind: "rescored" }
  | { kind: "skipped"; reason: string };

export type DraftSave = {
  analysis: QualityReport | null;
  outcome: SaveOutcome;
};

export function planDraftSave(draft: Draft, text: string, brandTone: BrandTone | null): DraftSave {
  if (brandTone === null) {
    return {
      analysis: draft.analysis,
      outcome: { kind: "skipped", reason: "your business profile did not load" },
    };
  }
  const rescored = rescoreText(draft, text, brandTone);
  if (!rescored.ok) {
    return {
      analysis: draft.analysis,
      outcome: { kind: "skipped", reason: rescored.error },
    };
  }
  return { analysis: rescored.value, outcome: { kind: "rescored" } };
}
