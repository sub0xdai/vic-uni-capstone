import test from "node:test";
import assert from "node:assert/strict";
import { InvariantError } from "./assert.ts";
import { assertQualityReport, needsRegeneration, weightedScore } from "./score.ts";
import {
  QUALITY_METRICS,
  QUALITY_THRESHOLD,
  QUALITY_WEIGHTS,
  type QualityMetric,
  type QualityReport,
} from "./types.ts";

function metrics(fill: number): Record<QualityMetric, number> {
  return Object.fromEntries(QUALITY_METRICS.map((key) => [key, fill])) as Record<
    QualityMetric,
    number
  >;
}

function report(score: number): QualityReport {
  return { ...metrics(score), overallScore: score };
}

test("an all-ones report scores 1 and an all-zeros report scores 0", () => {
  assert.equal(weightedScore(metrics(1)), 1);
  assert.equal(weightedScore(metrics(0)), 0);
  assert.equal(weightedScore(metrics(0.5)), 0.5);
});

test("each metric carries its declared weight", () => {
  for (const key of QUALITY_METRICS) {
    const single = metrics(0);
    single[key] = 1;
    assert.equal(weightedScore(single), QUALITY_WEIGHTS[key], `${key} weight changed`);
  }
});

test("the declared weights total 1", () => {
  const total = QUALITY_METRICS.reduce((sum, key) => sum + QUALITY_WEIGHTS[key], 0);
  assert.ok(Math.abs(total - 1) < 1e-9, `weights total ${total}`);
});

test("a consistent report passes", () => {
  assert.doesNotThrow(() => assertQualityReport(report(0.5)));
  assert.doesNotThrow(() => assertQualityReport(report(0)));
  assert.doesNotThrow(() => assertQualityReport(report(1)));
});

test("an overall score that disagrees with the metrics is rejected", () => {
  const drifted = { ...metrics(0.5), overallScore: 0.99 } as QualityReport;
  assert.throws(() => assertQualityReport(drifted), InvariantError);
  const lowered = { ...metrics(1), overallScore: 0.1 } as QualityReport;
  assert.throws(() => assertQualityReport(lowered), InvariantError);
});

test("an out-of-range metric is rejected", () => {
  const broken = { ...metrics(0.5), toneScore: 1.4 } as QualityReport;
  assert.throws(() => weightedScore(broken), InvariantError);
});

test("regeneration triggers below the threshold and not at it", () => {
  assert.equal(needsRegeneration(report(QUALITY_THRESHOLD - 0.01)), true);
  assert.equal(needsRegeneration(report(QUALITY_THRESHOLD)), false);
  assert.equal(needsRegeneration(report(1)), false);
});
