
"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Video,
  WandSparkles,
} from "lucide-react";

import {
  DraftEditor,
} from "@/components/draft-editor";

import {
  GeneratorPanel,
  type GeneratorPanelProps,
} from "@/components/generator-panel";

import { applyRating } from "@/lib/evaluate";
import { planDraftSave } from "@/lib/draft-save";
import { parseBusinessProfile } from "@/lib/rows";
import { requestFromSearch } from "@/lib/reuse";
import { supabaseBrowserResult } from "@/lib/supabase/client";

import {
  isContentType,
  type BusinessProfile,
  type Draft,
} from "@/lib/types";

type Note = {
  kind: "error" | "info";
  text: string;
};

const EMPTY_REQUEST: GeneratorPanelProps["value"] = {
  contentType: "social_caption",
  topic: "",
  keywords: [],
};

type ProfileResult = {
  profile: BusinessProfile | null;
  error: string | null;
};

function readDraft(value: unknown): Draft | null {
  if (value === null || typeof value !== "object") {
    return null;
  }

  const draft = (value as Record<string, unknown>).draft;

  if (draft === null || typeof draft !== "object") {
    return null;
  }

  const item = draft as Record<string, unknown>;

  if (
    typeof item.id !== "string" ||
    typeof item.contentText !== "string" ||
    typeof item.topic !== "string" ||
    !isContentType(item.contentType) ||
    !(item.rating === null || typeof item.rating === "number")
  ) {
    return null;
  }

  return draft as Draft;
}

function readError(value: unknown): string {
  if (value !== null && typeof value === "object") {
    const message = (value as Record<string, unknown>).error;

    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }

  return "Generation failed. Please try again.";
}

async function loadProfile(): Promise<ProfileResult> {
  const client = supabaseBrowserResult();

  if (!client.ok) {
    return {
      profile: null,
      error: client.error,
    };
  }

  const { data: auth } = await client.value.auth.getUser();

  if (auth.user === null) {
    return {
      profile: null,
      error: "You must be logged in to generate content.",
    };
  }

  const { data, error } = await client.value
    .from("business_profile")
    .select("*")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error !== null) {
    return {
      profile: null,
      error: `Could not load your business profile: ${error.message}`,
    };
  }

  if (data === null) {
    return {
      profile: null,
      error: "Create your business profile before generating content.",
    };
  }

  const parsed = parseBusinessProfile(data);

  return parsed.ok
    ? {
        profile: parsed.value,
        error: null,
      }
    : {
        profile: null,
        error: parsed.error,
      };
}

export default function GeneratePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f5f8fe]">
          <p className="text-sm text-slate-500">
            Loading your creation studio...
          </p>
        </main>
      }
    >
      <GenerateScreen />
    </Suspense>
  );
}

function GenerateScreen() {
  const params = useSearchParams();

  const [value, setValue] = useState<GeneratorPanelProps["value"]>(
    () => requestFromSearch(params.toString()) ?? EMPTY_REQUEST,
  );

  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [note, setNote] = useState<Note | null>(null);

  const inFlight = useRef(false);

  useEffect(() => {
    let active = true;

    void loadProfile().then((result) => {
      if (!active) {
        return;
      }

      setProfile(result.profile);

      if (result.error !== null) {
        setNote({
          kind: "error",
          text: result.error,
        });
      }
    });

    return () => {
      active = false;
    };
  }, []);

  async function generate() {
    if (inFlight.current) {
      return;
    }

    inFlight.current = true;
    setPending(true);
    setNote(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": crypto.randomUUID(),
        },
        body: JSON.stringify(value),
      });

      const payload: unknown = await response.json();

      if (!response.ok) {
        setNote({
          kind: "error",
          text: readError(payload),
        });

        return;
      }

      const created = readDraft(payload);

      if (created === null) {
        setNote({
          kind: "error",
          text: "The server sent back a draft we could not read.",
        });

        return;
      }

      setDraft(created);

      setNote({
        kind: "info",
        text: "Your content has been generated successfully.",
      });
    } catch {
      setNote({
        kind: "error",
        text: "Could not reach the server. Check your connection and try again.",
      });
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  async function save(text: string) {
    if (draft === null) {
      return;
    }

    const client = supabaseBrowserResult();

    if (!client.ok) {
      setNote({
        kind: "error",
        text: client.error,
      });

      return;
    }

    const plan = planDraftSave(
      draft,
      text,
      profile?.brandTone ?? null,
    );

    const analysis = plan.analysis;

    const problem =
      plan.outcome.kind === "skipped"
        ? plan.outcome.reason
        : null;

    const { error } = await client.value
      .from("generated_content")
      .update({
        content_text: text,
        analysis,
      })
      .eq("id", draft.id);

    if (error !== null) {
      setNote({
        kind: "error",
        text: `Could not save your changes: ${error.message}`,
      });

      return;
    }

    setDraft({
      ...draft,
      contentText: text,
      analysis,
    });

    setNote(
      problem === null
        ? {
            kind: "info",
            text: "Changes saved successfully.",
          }
        : {
            kind: "error",
            text: `Saved, but the score was not updated: ${problem}.`,
          },
    );
  }

  async function rate(rating: number) {
    if (draft === null) {
      return;
    }

    const client = supabaseBrowserResult();

    if (!client.ok) {
      setNote({
        kind: "error",
        text: client.error,
      });

      return;
    }

    const analysis =
      draft.analysis === null
        ? null
        : applyRating(draft.analysis, rating);

    const { error } = await client.value
      .from("generated_content")
      .update(
        analysis === null
          ? { rating }
          : { rating, analysis },
      )
      .eq("id", draft.id);

    if (error !== null) {
      setNote({
        kind: "error",
        text: `Could not save the rating: ${error.message}`,
      });

      return;
    }

    setDraft({
      ...draft,
      rating,
      analysis,
    });

    setNote({
      kind: "info",
      text: "Your rating has been saved.",
    });
  }

  return (
    <main className="min-h-screen bg-[#f5f8fe] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-[1440px] space-y-8">

        {/* Page heading */}

        <section className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              Content creation studio
            </div>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              AI Content Generator
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Create engaging marketing content tailored to your
              business, audience and brand voice.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </section>

        {/* Main workspace */}

        <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">

          {/* Generator panel */}

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md">
            <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <WandSparkles className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Create your content
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Configure your content and let AI do the writing.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-8">
              <GeneratorPanel
                value={value}
                pending={pending}
                profile={profile}
                onChange={setValue}
                onGenerate={() => {
                  void generate();
                }}
              />
            </div>
          </div>

          {/* Right information panel */}

          <aside className="space-y-5">

            {/* Business profile */}

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Building2 className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    Business profile
                  </h3>

                  <p className="text-xs text-slate-500">
                    Your brand identity
                  </p>
                </div>
              </div>

              {profile === null ? (
                <div className="mt-5 rounded-xl bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-800">
                    Profile unavailable
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-700">
                    Set up your business profile before generating content.
                  </p>

                  <Link
                    href="/onboarding"
                    className="mt-3 inline-block text-xs font-bold text-amber-800 underline"
                  >
                    Set up profile →
                  </Link>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  <div>
                    <p className="text-xs text-slate-400">
                      Business name
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {profile.businessName}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Industry
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {profile.industry}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Brand voice
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {profile.brandTone}
                    </p>
                  </div>

                  <Link
                    href="/onboarding"
                    className="inline-block text-xs font-bold text-blue-600 hover:text-blue-800"
                  >
                    Edit business profile →
                  </Link>
                </div>
              )}
            </div>

            {/* Workflow guidance */}

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-slate-900">
                How it works
              </h3>

              <div className="mt-5 space-y-5">
                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                    1
                  </span>

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Choose your content
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Select the format and describe your topic.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                    2
                  </span>

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Generate with AI
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Create content using your business profile.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                    3
                  </span>

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Review and save
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Edit your draft, check its quality and save changes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Media studio preview */}

            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />

                <h3 className="font-bold text-slate-900">
                  Creative media studio
                </h3>
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-600">
                Create visual marketing assets to complement your
                generated content.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-blue-100 bg-white p-3">
                  <ImageIcon className="h-5 w-5 text-blue-600" />

                  <p className="mt-2 text-xs font-bold text-slate-800">
                    AI images
                  </p>

                  <p className="mt-1 text-[11px] text-slate-400">
                    Image creation
                  </p>
                </div>

                <div className="rounded-xl border border-blue-100 bg-white p-3">
                  <Video className="h-5 w-5 text-blue-600" />

                  <p className="mt-2 text-xs font-bold text-slate-800">
                    AI videos
                  </p>

                  <p className="mt-1 text-[11px] text-slate-400">
                    Video creation
                  </p>
                </div>
              </div>

              <p className="mt-4 text-[11px] leading-5 text-slate-500">
                Media generation will be connected as a separate
                feature. No sample or placeholder media is generated here.
              </p>
            </div>
          </aside>
        </section>

        {/* Notifications */}

        {note === null ? null : (
          <div
            className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
              note.kind === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
            role={note.kind === "error" ? "alert" : "status"}
          >
            {note.kind === "error" ? (
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            )}

            {note.text}
          </div>
        )}

        {/* Generated draft editor */}

        {draft === null ? null : (
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <FileText className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Your generated draft
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Review, edit and rate your content.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-8">
              <DraftEditor
                key={draft.id}
                draft={draft}
                onSave={(text) => {
                  void save(text);
                }}
                onRate={(rating) => {
                  void rate(rating);
                }}
                onCopy={() => {
                  setNote({
                    kind: "info",
                    text: "Copied to clipboard.",
                  });
                }}
              />
            </div>
          </section>
        )}

        {/* Footer */}

        <footer className="pb-5 text-center text-xs text-slate-400">
          ContentCraft · AI-powered marketing content creation
        </footer>
      </div>
    </main>
  );
}
