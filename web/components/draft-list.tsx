"use client";

import type { Draft } from "@/lib/types";

export type DraftListProps = {
  drafts: Draft[];
  onDelete: (id: string) => void;
};

export function DraftList(_props: DraftListProps) {
  return (
    <div className="rounded-xl border-2 border-dashed border-amber-400/70 bg-amber-50/60 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
        W3.3 not built
      </p>
      <p className="mt-1 text-base font-semibold text-neutral-900">
        Dashboard draft list
      </p>
      <ul className="mt-3 space-y-1 text-sm text-neutral-700">
        <li>- One row per draft: type, topic, date, stars</li>
        <li>- Delete button per row</li>
        <li>- Empty state: no content yet, with a link to the generator</li>
      </ul>
    </div>
  );
}
