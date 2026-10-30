"use client";

import { Stars } from "@/components/ui";
import {
  CONTENT_TYPE_LABELS,
  DRAFT_STATUS_LABELS,
  type Draft,
  type DraftStatus,
} from "@/lib/types";

export type DraftListProps = {
  drafts: Draft[];
  onDelete: (id: string) => void;
  onRate?: (id: string, rating: number) => void;
  onStatus?: (id: string, status: DraftStatus) => void;
};

const ROW = "flex flex-wrap items-center gap-4 border-b border-black/5 py-3 last:border-0";
const DELETE =
  "rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium " +
  "text-red-700 hover:bg-red-50";
const PUBLISH =
  "rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white " +
  "hover:bg-emerald-700 disabled:opacity-40";
const DISCARD =
  "rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium " +
  "text-neutral-700 hover:bg-neutral-50 disabled:opacity-40";
const BADGE = "rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700";

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function DraftList({ drafts, onDelete, onRate, onStatus }: DraftListProps) {
  if (drafts.length === 0) {
    return <p className="text-sm text-neutral-600">No content yet.</p>;
  }

  return (
    <ul>
      {drafts.map((draft) => (
        <li key={draft.id} className={ROW}>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-neutral-900">{draft.topic}</p>
            <p className="text-xs text-neutral-500">
              {CONTENT_TYPE_LABELS[draft.contentType]} - {formatDate(draft.createdAt)}
            </p>
          </div>

          <span className={BADGE}>{DRAFT_STATUS_LABELS[draft.status]}</span>

          <Stars
            value={draft.rating}
            onChange={
              onRate === undefined
                ? undefined
                : (rating) => {
                    onRate(draft.id, rating);
                  }
            }
          />

          {onStatus === undefined ? null : (
            <>
              <button
                type="button"
                disabled={draft.status === "published"}
                onClick={() => {
                  onStatus(draft.id, "published");
                }}
                className={PUBLISH}
              >
                Publish
              </button>
              <button
                type="button"
                disabled={draft.status === "discarded"}
                onClick={() => {
                  onStatus(draft.id, "discarded");
                }}
                className={DISCARD}
              >
                Discard
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              onDelete(draft.id);
            }}
            className={DELETE}
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}