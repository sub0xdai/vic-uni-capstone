"use client";

import type { ContentType } from "@/lib/types";

export type GeneratorPanelProps = {
  value: { contentType: ContentType; topic: string; keywords: string[] };
  pending: boolean;
  onChange: (next: GeneratorPanelProps["value"]) => void;
  onGenerate: () => void;
};

export function GeneratorPanel(_props: GeneratorPanelProps) {
  return (
    <div className="rounded-xl border-2 border-dashed border-amber-400/70 bg-amber-50/60 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
        W3.1 not built
      </p>
      <p className="mt-1 text-base font-semibold text-neutral-900">
        Generator input panel
      </p>
      <ul className="mt-3 space-y-1 text-sm text-neutral-700">
        <li>- Content type tabs: Blog outline, Social caption, Email newsletter</li>
        <li>- Topic field, required</li>
        <li>- Keywords, add and remove tags</li>
        <li>- Read-only summary of brand tone and target audience</li>
        <li>- Generate button, disabled while pending, shows a spinner</li>
      </ul>
    </div>
  );
}
