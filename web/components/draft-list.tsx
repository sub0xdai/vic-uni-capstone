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

const ROW = "border-b border-[#e2eaf5] py-4 last:border-0";
const BUTTON = "rounded-lg px-3 py-1.5 text-sm font-bold transition disabled:opacity-40";
const DELETE = `${BUTTON} border border-red-200 bg-white text-red-600 hover:bg-red-50`;
const PUBLISH = `${BUTTON} bg-emerald-600 text-white hover:bg-emerald-700`;
const DISCARD = `${BUTTON} border border-[#bcd2ff] bg-white text-indigo-600 hover:bg-indigo-50`;

const BADGE_BASE = "shrink-0 rounded-full px-3 py-1 text-xs font-bold";
const BADGE_STYLE: Record<DraftStatus, string> = {
  draft: "bg-indigo-50 text-indigo-600",
  published: "bg-emerald-50 text-emerald-700",
  discarded: "bg-neutral-100 text-neutral-500",
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Australia/Sydney",
  });
}

export function DraftList({ drafts, onDelete, onRate, onStatus }: DraftListProps) {
  if (drafts.length === 0) {
    return <p className="text-sm text-slate-500">No content yet.</p>;
  }

  return (
    <ul>
      {drafts.map((draft) => (
        <li key={draft.id} className={ROW}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-neutral-900">{draft.topic}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {CONTENT_TYPE_LABELS[draft.contentType]} - {formatDate(draft.createdAt)}
              </p>
            </div>
            <span className={`${BADGE_BASE} ${BADGE_STYLE[draft.status]}`}>
              {DRAFT_STATUS_LABELS[draft.status]}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
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

            <div className="ml-auto flex flex-wrap items-center gap-2">
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
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}