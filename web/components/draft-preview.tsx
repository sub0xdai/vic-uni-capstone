import { previewOf } from "@/lib/format-preview";
import { ctaMatch } from "@/lib/evaluate";
import type { ContentType } from "@/lib/types";

export type DraftPreviewProps = {
  contentType: ContentType;
  text: string;
};

const BLOCK = "rounded-lg bg-neutral-50 p-3";
const LABEL = "text-[11px] font-bold uppercase tracking-wide text-slate-500";
const MISSING = "text-xs italic text-neutral-400";
const VALUE = "mt-1 whitespace-pre-wrap text-sm text-neutral-800";

function Part({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className={LABEL}>{label}</p>
      {value === null ? <p className={MISSING}>not found</p> : <p className={VALUE}>{value}</p>}
    </div>
  );
}

export function DraftPreview({ contentType, text }: DraftPreviewProps) {
  const view = previewOf(contentType, text);

  if (view.kind === "plain") {
    return (
      <div className={BLOCK}>
        <p className={MISSING}>No labels found, showing the text as written.</p>
        <p className={VALUE}>{view.text}</p>
      </div>
    );
  }

  if (view.kind === "caption") {
    const cta = ctaMatch(view.text);
    const width = Math.min(100, Math.round((view.length / view.limit) * 100));
    const kept = view.text.slice(0, view.limit);
    const overflow = view.text.slice(view.limit);
    return (
      <div className={BLOCK}>
        <p className="whitespace-pre-wrap text-sm text-neutral-800">
          {kept}
          {overflow.length === 0 ? null : (
            <mark className="bg-red-100 text-red-800">{overflow}</mark>
          )}
        </p>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-neutral-600">
            <span>Characters</span>
            <span className={view.overBudget ? "font-bold text-red-600" : "text-neutral-500"}>
              {`${view.length} / ${view.limit}`}
            </span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-neutral-200">
            <div
              className={`h-full rounded-full ${view.overBudget ? "bg-red-500" : "bg-indigo-500"}`}
              style={{ width: `${width}%` }}
            />
          </div>
          <p className={`mt-1 text-xs ${view.overBudget ? "text-red-600" : "text-slate-500"}`}>
            {view.overBudget
              ? `Over by ${view.length - view.limit} characters.`
              : "Within the limit."}
          </p>
        </div>
        <div className="mt-3">
          <p className={LABEL}>Call to action</p>
          {cta === null ? (
            <p className={MISSING}>not found</p>
          ) : (
            <p className={VALUE}>{`"${cta}"`}</p>
          )}
        </div>
      </div>
    );
  }

  if (view.kind === "email") {
    return (
      <div className="space-y-3">
        <Part label="Subject" value={view.subject} />
        <Part label="Preview" value={view.preview} />
        <Part label="Body" value={view.body.length === 0 ? null : view.body} />
        <Part label="Button" value={view.button} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Part label="Introduction" value={view.introduction} />
      <div>
        <p className={LABEL}>{`Headings (${view.headings.length})`}</p>
        {view.headings.length === 0 ? (
          <p className={MISSING}>not found</p>
        ) : (
          <ul className="mt-1 space-y-1 text-sm text-neutral-800">
            {view.headings.map((heading) => (
              <li key={heading}>{heading}</li>
            ))}
          </ul>
        )}
      </div>
      <Part label="Conclusion" value={view.conclusion} />
    </div>
  );
}
