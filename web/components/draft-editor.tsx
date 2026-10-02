"use client";

import type { Draft } from "@/lib/types";

export type DraftEditorProps = {
  draft: Draft;
  onSave: (text: string) => void;
  onRate: (rating: number) => void;
  onCopy: () => void;
};

export function DraftEditor(_props: DraftEditorProps) {
  return (
    <div className="rounded-xl border-2 border-dashed border-amber-400/70 bg-amber-50/60 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
        W3.2 not built
      </p>
      <p className="mt-1 text-base font-semibold text-neutral-900">
        Draft editor and actions
      </p>
      <ul className="mt-3 space-y-1 text-sm text-neutral-700">
        <li>- Editable textarea seeded with the generated text</li>
        <li>- Save button, disabled until the text changes</li>
        <li>- Copy to clipboard button with a confirmation</li>
        <li>- Five star rating, saves on click</li>
      </ul>
    </div>
  );
}
