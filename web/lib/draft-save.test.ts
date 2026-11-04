import assert from "node:assert/strict";
import test from "node:test";
import { planDraftSave } from "./draft-save.ts";
import type { Draft, QualityReport } from "./types.ts";

const REPORT: QualityReport = {
  readabilityScore: 0.5,
  toneScore: 0.5,
  keywordScore: 0.5,
  structureScore: 1,
  userSatisfactionScore: 0.5,
  overallScore: 0.575,
};

const DRAFT: Draft = {
  id: "d1",
  userId: "u1",
  contentType: "social_caption",
  topic: "Quiet Tuesday",
  keywords: ["tasting"],
  contentText: "Quiet Tuesday? Book a tasting flight this week and tell us what you think.",
  rating: 4,
  status: "draft",
  statusChangedAt: null,
  analysis: REPORT,
  parameters: null,
  usage: null,
  createdAt: "2026-11-05T09:00:00.000Z",
};

test("a save with the tone available replaces the report", () => {
  const text = "Quiet Tuesday? Book a tasting flight and tell us.";
  const plan = planDraftSave(DRAFT, text, "friendly");
  assert.equal(plan.outcome.kind, "rescored");
  assert.notEqual(plan.analysis, REPORT);
  assert.equal(plan.analysis?.userSatisfactionScore, 0.8);
});

test("a save without the tone keeps the old report and says why", () => {
  const plan = planDraftSave(DRAFT, "Quiet Tuesday? Book a tasting flight.", null);
  assert.equal(plan.outcome.kind, "skipped");
  if (plan.outcome.kind === "skipped") {
    assert.match(plan.outcome.reason, /profile/);
  }
  assert.equal(plan.analysis, REPORT);
});

test("a save the scorer refuses keeps the old report and passes the reason on", () => {
  const plan = planDraftSave(DRAFT, "ok", "friendly");
  assert.equal(plan.outcome.kind, "skipped");
  if (plan.outcome.kind === "skipped") {
    assert.match(plan.outcome.reason, /too short/);
  }
  assert.equal(plan.analysis, REPORT);
});

test("an unscored draft stays unscored when the tone is missing", () => {
  const unscored: Draft = { ...DRAFT, analysis: null };
  const plan = planDraftSave(unscored, "Quiet Tuesday? Book a tasting flight.", null);
  assert.equal(plan.analysis, null);
  assert.equal(plan.outcome.kind, "skipped");
});
