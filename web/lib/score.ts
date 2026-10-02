import { invariant } from "./assert.ts";
import {
  QUALITY_METRICS,
  QUALITY_THRESHOLD,
  QUALITY_WEIGHTS,
  type QualityMetric,
  type QualityReport,
} from "./types.ts";

export function metricsOf(report: QualityReport): Record<QualityMetric, number> {
  invariant(report !== null && typeof report === "object", "quality report is not an object");
  invariant(QUALITY_METRICS.length > 0, "no quality metrics are declared");
  const metrics = {} as Record<QualityMetric, number>;
  for (const key of QUALITY_METRICS) {
    metrics[key] = report[key];
  }
  invariant(Object.keys(metrics).length === QUALITY_METRICS.length, "metric set changed");
  return metrics;
}

export function weightedScore(metrics: Record<QualityMetric, number>): number {
  invariant(QUALITY_METRICS.length > 0, "no quality metrics are declared");
  let total = 0;
  let weight = 0;
  for (const key of QUALITY_METRICS) {
    const value = metrics[key];
    invariant(value >= 0 && value <= 1, `${key} out of range: ${value}`);
    total += value * QUALITY_WEIGHTS[key];
    weight += QUALITY_WEIGHTS[key];
  }
  invariant(Math.abs(weight - 1) < 1e-9, `quality weights total ${weight}, expected 1`);
  invariant(total >= 0 && total <= 1, `weighted score out of range: ${total}`);
  return total;
}

export function assertQualityReport(report: QualityReport): void {
  invariant(report !== null && typeof report === "object", "quality report is not an object");
  const expected = weightedScore(metricsOf(report));
  const drift = Math.abs(expected - report.overallScore);
  invariant(drift < 1e-9, `overall score ${report.overallScore} does not match ${expected}`);
}

export function needsRegeneration(report: QualityReport): boolean {
  assertQualityReport(report);
  invariant(QUALITY_THRESHOLD > 0 && QUALITY_THRESHOLD < 1, "threshold is outside 0 to 1");
  return report.overallScore < QUALITY_THRESHOLD;
}
