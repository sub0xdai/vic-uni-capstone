"use client";

import { useEffect, useState } from "react";
import { Button, Stars, controlClass } from "@/components/ui";
import type { Draft } from "@/lib/types";

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