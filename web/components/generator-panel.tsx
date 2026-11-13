
"use client";

import { useState } from "react";
import {
  FileText,
  MessageSquare,
  Mail,
  Image as ImageIcon,
  Video,
  Plus,
  X,
  Sparkles,
  WandSparkles,
} from "lucide-react";

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
  value: {
    contentType: ContentType;
    topic: string;
    keywords: string[];
  };
  pending: boolean;
  onChange: (next: GeneratorPanelProps["value"]) => void;
  onGenerate: () => void;
  profile?: BusinessProfile | null;
};

type GeneratorMode = ContentType | "image_generation" | "video_generation";

const OPTIONS = [
  {
    id: "blog_outline",
    title: "Blog Outline",
    description: "Plan articles and blog posts",
    icon: FileText,
    category: "Writing",
  },
  {
    id: "social_caption",
    title: "Social Media Caption",
    description: "Create engaging social posts",
    icon: MessageSquare,
    category: "Writing",
  },
  {
    id: "email_newsletter",
    title: "Email Newsletter",
    description: "Write marketing emails",
    icon: Mail,
    category: "Writing",
  },
  {
    id: "image_generation",
    title: "AI Image Generator",
    description: "Create marketing images",
    icon: ImageIcon,
    category: "Visual media",
  },
  {
    id: "video_generation",
    title: "AI Video Generator",
    description: "Create promotional videos",
    icon: Video,
    category: "Visual media",
  },
] as const;

export function GeneratorPanel({
  value,
  pending,
  onChange,
  onGenerate,
  profile = null,
}: GeneratorPanelProps) {
  const [keywordInput, setKeywordInput] = useState("");
  const [selectedMode, setSelectedMode] = useState<GeneratorMode>(
    value.contentType,
  );

  const topicMissing = value.topic.trim().length === 0;

  const isMediaMode =
    selectedMode === "image_generation" ||
    selectedMode === "video_generation";

  function selectMode(mode: GeneratorMode) {
    setSelectedMode(mode);

    if (
      mode !== "image_generation" &&
      mode !== "video_generation"
    ) {
      onChange({
        ...value,
        contentType: mode,
      });
    }
  }

  function addKeyword() {
    const word = keywordInput.trim();

    if (word.length === 0) {
      return;
    }

    const exists = value.keywords.some(
      (item) => item.toLowerCase() === word.toLowerCase(),
    );

    if (!exists && value.keywords.length < MAX_KEYWORDS) {
      onChange({
        ...value,
        keywords: [...value.keywords, word],
      });
    }

    setKeywordInput("");
  }

  function removeKeyword(word: string) {
    onChange({
      ...value,
      keywords: value.keywords.filter((item) => item !== word),
    });
  }

  return (
    <form
      className="space-y-7"
      onSubmit={(event) => {
        event.preventDefault();

        if (!pending && !topicMissing && !isMediaMode) {
          onGenerate();
        }
      }}
    >
      {/* Content type selector */}

      <section>
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900">
            What would you like to create?
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Select a content format to get started.
          </p>
        </div>

        <div
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          role="group"
          aria-label="Content creation options"
        >
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            const selected = selectedMode === option.id;

            return (
              <button
                key={option.id}
                type="button"
                disabled={pending}
                aria-pressed={selected}
                onClick={() => {
                  selectMode(option.id);
                }}
                className={`group relative flex min-h-[140px] flex-col items-start rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 ${
                  selected
                    ? "border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-100"
                    : "border-slate-200 bg-white hover:border-blue-300"
                }`}
              >
                <div className="flex w-full items-start justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                      selected
                        ? "bg-blue-600 text-white"
                        : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  {selected ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                      <Sparkles className="h-3.5 w-3.5" />
                    </span>
                  ) : (
                    <span className="h-6 w-6 rounded-full border border-slate-200 transition-colors group-hover:border-blue-300" />
                  )}
                </div>

                <div className="mt-4">
                  <p
                    className={`text-sm font-bold ${
                      selected ? "text-blue-700" : "text-slate-800"
                    }`}
                  >
                    {option.title}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {option.description}
                  </p>
                </div>

                <span className="absolute right-4 bottom-3 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                  {option.category}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Media selection notice */}

      {isMediaMode ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600">
              {selectedMode === "image_generation" ? (
                <ImageIcon className="h-5 w-5" />
              ) : (
                <Video className="h-5 w-5" />
              )}
            </div>

            <div>
              <p className="text-sm font-bold text-blue-900">
                {selectedMode === "image_generation"
                  ? "AI Image Generator"
                  : "AI Video Generator"}
              </p>

              <p className="mt-1 text-xs leading-5 text-blue-800">
                This generation mode has its own media workflow.
                Its dedicated AI service and generation controls
                will be connected separately.
              </p>

              <button
                type="button"
                onClick={() => {
                  selectMode("social_caption");
                }}
                className="mt-3 text-xs font-bold text-blue-700 underline hover:text-blue-900"
              >
                Return to text generation
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Topic */}

          <Field
            label="Topic"
            hint="What should the content be about?"
          >
            <input
              type="text"
              className={controlClass}
              value={value.topic}
              disabled={pending}
              placeholder="e.g. Single origin Ethiopian coffee launch"
              onChange={(event) => {
                onChange({
                  ...value,
                  topic: event.target.value,
                });
              }}
            />
          </Field>

          {/* Keywords */}

          <section>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Field
                  label="Keywords"
                  hint={`Press Enter or Add. Optional. ${value.keywords.length}/${MAX_KEYWORDS}`}
                >
                  <input
                    type="text"
                    className={controlClass}
                    value={keywordInput}
                    disabled={pending || value.keywords.length >= MAX_KEYWORDS}
                    placeholder="Add keywords to guide your content..."
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

              <Button
                type="button"
                variant="ghost"
                disabled={pending || value.keywords.length >= MAX_KEYWORDS}
                onClick={addKeyword}
              >
                <span className="flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  Add
                </span>
              </Button>
            </div>

            {value.keywords.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {value.keywords.map((word) => (
                  <li
                    key={word}
                    className="flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"
                  >
                    {word}

                    <button
                      type="button"
                      aria-label={`Remove keyword ${word}`}
                      disabled={pending}
                      onClick={() => {
                        removeKeyword(word);
                      }}
                      className="ml-1 rounded-full p-0.5 text-blue-500 transition hover:bg-blue-100 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Brand profile summary */}

          {profile === null ? null : (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Sparkles className="h-4 w-4 text-blue-600" />
                Your content is tailored to your brand
              </div>

              <p className="mt-2 text-xs leading-6 text-slate-600">
                Writing for{" "}
                <strong className="text-slate-900">
                  {profile.businessName}
                </strong>
                . Tone:{" "}
                <strong className="text-slate-900">
                  {BRAND_TONE_LABELS[profile.brandTone]}
                </strong>
                . Audience: {profile.targetAudience}
              </p>
            </div>
          )}

          {/* Generate button */}

          <Button
            type="submit"
            disabled={pending || topicMissing}
          >
            {pending ? (
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  aria-hidden="true"
                />
                Generating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <WandSparkles className="h-4 w-4" />
                Generate content
              </span>
            )}
          </Button>
        </>
      )}
    </form>
  );
}
