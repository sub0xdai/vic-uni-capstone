import {
  QUALITY_METRICS,
  QUALITY_THRESHOLD,
  type QualityMetric,
  type QualityReport,
} from "@/lib/types";

export type QualityCardProps = {
  report: QualityReport | null;
};

const LABELS: Record<QualityMetric, string> = {
  readabilityScore: "Readability",
  toneScore: "Tone",
  keywordScore: "Keywords",
  structureScore: "Structure",
  userSatisfactionScore: "User satisfaction",
};

export function QualityCard({ report }: QualityCardProps) {
  if (report === null) {
    return <p className="text-sm text-neutral-500">Not scored yet.</p>;
  }

  const overall = Math.round(report.overallScore * 100);
  const below = report.overallScore < QUALITY_THRESHOLD;

  return (
    <div>
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-neutral-900">{overall}%</span>
        <span className="text-xs text-neutral-500">overall quality</span>
        {below ? (
          <span className="text-xs font-medium text-amber-700">below threshold</span>
        ) : null}
      </div>

      <dl className="space-y-2">
        {QUALITY_METRICS.map((metric) => {
          const value = Math.round(report[metric] * 100);
          return (
            <div key={metric}>
              <div className="flex justify-between text-xs text-neutral-600">
                <dt>{LABELS[metric]}</dt>
                <dd>{value}%</dd>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-neutral-200">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
