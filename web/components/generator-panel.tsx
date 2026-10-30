"use client";

import { useState } from "react";
import { Button, Field, controlClass } from "@/components/ui";
import {
  BRAND_TONE_LABELS,
  CONTENT_TYPES,
  CONTENT_TYPE_LABELS,
  type BusinessProfile,
  type ContentType,
} from "@/lib/types";

const MAX_KEYWORDS = 10;

export type GeneratorPanelProps = {
  value: { contentType: ContentType; topic: string; keywords: string[] };
  pending: boolean;
  onChange: (next: GeneratorPanelProps["value"]) => void;
  onGenerate: () => void;
  profile?: BusinessProfile | null;
};

const TAB_BASE = "rounded-lg px-3 py-2 text-sm font-bold transition disabled:opacity-50";
const TAB_ON = `${TAB_BASE} bg-indigo-600 text-white`;
const TAB_OFF = `${TAB_BASE} border border-[#bcd2ff] bg-white text-indigo-600 hover:bg-indigo-50`;

export function GeneratorPanel({
  value,
  pending,
  onChange,
  onGenerate,
  profile = null,
}: GeneratorPanelProps) {
  const [keywordInput, setKeywordInput] = useState("");
  const topicMissing = value.topic.trim().length === 0;

  function addKeyword() {
    const word = keywordInput.trim();
    if (word.length === 0) {
      return;
    }
    const exists = value.keywords.some((item) => item.toLowerCase() === word.toLowerCase());
    if (!exists && value.keywords.length < MAX_KEYWORDS) {
      onChange({ ...value, keywords: [...value.keywords, word] });
    }
    setKeywordInput("");
  }

  function removeKeyword(word: string) {
    onChange({ ...value, keywords: value.keywords.filter((item) => item !== word) });
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!pending && !topicMissing) {
          onGenerate();
        }
      }}
    >
      <div>
        <span className="mb-1.5 block text-[13px] font-bold text-neutral-900">
          Content type
        </span>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Content type">
          {CONTENT_TYPES.map((kind) => (
            <button
              key={kind}
              type="button"
              disabled={pending}
              aria-pressed={value.contentType === kind}
              onClick={() => {
                onChange({ ...value, contentType: kind });
              }}
              className={value.contentType === kind ? TAB_ON : TAB_OFF}
            >
              {CONTENT_TYPE_LABELS[kind]}
            </button>
          ))}
        </div>
      </div>

      <Field label="Topic" hint="What should the content be about?">
        <input
          type="text"
          className={controlClass}
          value={value.topic}
          disabled={pending}
          placeholder="e.g. Single origin Ethiopian launch"
          onChange={(event) => {
            onChange({ ...value, topic: event.target.value });
          }}
        />
      </Field>

      <div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Field label="Keywords" hint="Press Enter or Add. Optional.">
              <input
                type="text"
                className={controlClass}
                value={keywordInput}
                disabled={pending}
                onChange={(event) => {
                  setKeywordInput(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addKeyword();
                  }
                }}
              />
            </Field>
          </div>
          <Button type="button" variant="ghost" disabled={pending} onClick={addKeyword}>
            Add
          </Button>
        </div>
        {value.keywords.length === 0 ? null : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {value.keywords.map((word) => (
              <li
                key={word}
                className={
                  "flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 " +
                  "text-sm text-indigo-700"
                }
              >
                {word}
                <button
                  type="button"
                  aria-label={`Remove keyword ${word}`}
                  disabled={pending}
                  onClick={() => {
                    removeKeyword(word);
                  }}
                  className="ml-1 text-indigo-700 hover:text-red-600"
                >
                  x
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {profile === null ? null : (
        <p className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-700">
          Writing for <strong>{profile.businessName}</strong>. Tone:{" "}
          {BRAND_TONE_LABELS[profile.brandTone]}. Audience: {profile.targetAudience}
        </p>
      )}

      <Button type="submit" disabled={pending || topicMissing}>
        {pending ? (
          <span className="flex items-center gap-2">
            <span
              className={
                "inline-block h-4 w-4 animate-spin rounded-full " +
                "border-2 border-white/40 border-t-white"
              }
              aria-hidden="true"
            />
            Generating...
          </span>
        ) : (
          "Generate"
        )}
      </Button>
    </form>
  );
}