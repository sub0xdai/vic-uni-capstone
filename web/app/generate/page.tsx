"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DraftEditor } from "@/components/draft-editor";
import { GeneratorPanel, type GeneratorPanelProps } from "@/components/generator-panel";
import { Card } from "@/components/ui";
import { applyRating, rescoreText } from "@/lib/evaluate";
import { parseBusinessProfile } from "@/lib/rows";
import { requestFromSearch } from "@/lib/reuse";
import { supabaseBrowserResult } from "@/lib/supabase/client";
import { isContentType, type BusinessProfile, type Draft } from "@/lib/types";

type Note = { kind: "error" | "info"; text: string };

const EMPTY_REQUEST: GeneratorPanelProps["value"] = {
  contentType: "social_caption",
  topic: "",
  keywords: [],
};

type ProfileResult = { profile: BusinessProfile | null; error: string | null };

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
    return { profile: null, error: client.error };
  }
  const { data: auth } = await client.value.auth.getUser();
  if (auth.user === null) {
    return { profile: null, error: "You must be logged in to generate content." };
  }
  const { data, error } = await client.value
    .from("business_profile")
    .select("*")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (error !== null) {
    return { profile: null, error: `Could not load your business profile: ${error.message}` };
  }
  if (data === null) {
    return { profile: null, error: "Create your business profile before generating content." };
  }
  const parsed = parseBusinessProfile(data);
  return parsed.ok
    ? { profile: parsed.value, error: null }
    : { profile: null, error: parsed.error };
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading...</p>}>
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
  const inFlight = useRef(false);
  const [note, setNote] = useState<Note | null>(null);

  useEffect(() => {
    let active = true;
    void loadProfile().then((result) => {
      if (!active) {
        return;
      }
      setProfile(result.profile);
      if (result.error !== null) {
        setNote({ kind: "error", text: result.error });
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
        setNote({ kind: "error", text: readError(payload) });
        return;
      }
      const created = readDraft(payload);
      if (created === null) {
        setNote({ kind: "error", text: "The server sent back a draft we could not read." });
        return;
      }
      setDraft(created);
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
      setNote({ kind: "error", text: client.error });
      return;
    }
    let analysis = draft.analysis;
    let problem: string | null = null;
    if (profile === null) {
      problem = "your business profile did not load";
    } else {
      const rescored = rescoreText(draft, text, profile.brandTone);
      if (rescored.ok) {
        analysis = rescored.value;
      } else {
        problem = rescored.error;
      }
    }
    const { error } = await client.value
      .from("generated_content")
      .update({ content_text: text, analysis })
      .eq("id", draft.id);
    if (error !== null) {
      setNote({ kind: "error", text: `Could not save your changes: ${error.message}` });
      return;
    }
    setDraft({ ...draft, contentText: text, analysis });
    setNote(
      problem === null
        ? { kind: "info", text: "Changes saved." }
        : { kind: "error", text: `Saved, but the score was not updated: ${problem}.` },
    );
  }

  async function rate(rating: number) {
    if (draft === null) {
      return;
    }
    const client = supabaseBrowserResult();
    if (!client.ok) {
      setNote({ kind: "error", text: client.error });
      return;
    }
    const analysis = draft.analysis === null ? null : applyRating(draft.analysis, rating);
    const { error } = await client.value
      .from("generated_content")
      .update(analysis === null ? { rating } : { rating, analysis })
      .eq("id", draft.id);
    if (error !== null) {
      setNote({ kind: "error", text: `Could not save the rating: ${error.message}` });
      return;
    }
    setDraft({ ...draft, rating, analysis });
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <Card
        title="Generate content"
        subtitle="Pick a type, give it a topic, and the AI writes a draft in your brand voice."
      >
        <GeneratorPanel
          value={value}
          pending={pending}
          profile={profile}
          onChange={setValue}
          onGenerate={() => {
            void generate();
          }}
        />
      </Card>

      {note === null ? null : (
        <p
          className={`text-sm ${note.kind === "error" ? "text-red-600" : "text-emerald-700"}`}
          role={note.kind === "error" ? "alert" : "status"}
        >
          {note.text}
        </p>
      )}

      {draft === null ? null : (
        <Card title="Your draft" subtitle={draft.topic}>
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
              setNote({ kind: "info", text: "Copied to clipboard." });
            }}
          />
        </Card>
      )}

      <Link
        href="/dashboard"
        className="inline-block text-sm font-medium text-indigo-600 hover:underline"
      >
        Back to dashboard
      </Link>
    </main>
  );
}