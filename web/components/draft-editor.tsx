"use client";

import { useEffect, useState } from "react";
import { Button, Stars, controlClass } from "@/components/ui";
import { structureParts } from "@/lib/evaluate";
import { SOCIAL_CAPTION_MAX, type Draft } from "@/lib/types";

export type DraftEditorProps = {
  draft: Draft;
  onSave: (text: string) => void;
  onRate: (rating: number) => void;
  onCopy: () => void;
};

type CopyState = "idle" | "copied" | "failed";

export function DraftEditor({ draft, onSave, onRate, onCopy }: DraftEditorProps) {
  const [text, setText] = useState(draft.contentText);
  const [copy, setCopy] = useState<CopyState>("idle");

  useEffect(() => {
    if (copy === "idle") {
      return;
    }
    const timer = setTimeout(() => {
      setCopy("idle");
    }, 2000);
    return () => {
      clearTimeout(timer);
    };
  }, [copy]);

  const changed = text !== draft.contentText;
  const length = text.trim().length;
  const overBudget = length > SOCIAL_CAPTION_MAX;
  const parts =
    draft.contentType === "social_caption"
      ? structureParts(text, draft.contentType).filter((part) => part.id !== "character limit")
      : structureParts(text, draft.contentType);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      setCopy("copied");
      onCopy();
    } catch {
      setCopy("failed");
    }
  }

  return (
    <div className="space-y-4">
      <textarea
        aria-label="Draft text"
        className={controlClass}
        rows={10}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
        }}
      />

      <div className="flex flex-wrap items-center gap-2" aria-label="What the scorer looks for">
        {draft.contentType === "social_caption" ? (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
              overBudget ? "bg-red-50 text-red-700" : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {`${length} / ${SOCIAL_CAPTION_MAX}`}
          </span>
        ) : null}
        {parts.map((part) => (
          <span
            key={part.id}
            aria-label={`${part.id}: ${part.passed ? "found" : "missing"}`}
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
              part.passed ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"
            }`}
          >
            {part.id}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          disabled={!changed || text.trim().length === 0}
          onClick={() => {
            onSave(text);
          }}
        >
          Save changes
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            void copyText();
          }}
        >
          Copy to clipboard
        </Button>
        {copy === "copied" ? (
          <span className="text-sm text-emerald-700" role="status">
            Copied
          </span>
        ) : null}
        {copy === "failed" ? (
          <span className="text-sm text-red-600" role="alert">
            Copy failed. Select the text and copy it by hand.
          </span>
        ) : null}
      </div>

      <div>
        <p className="mb-1.5 text-[13px] font-bold text-neutral-900">Rate this draft</p>
        <Stars value={draft.rating} onChange={onRate} />
      </div>
    </div>
  );
}