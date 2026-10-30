"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DraftEditor } from "@/components/draft-editor";
import { GeneratorPanel, type GeneratorPanelProps } from "@/components/generator-panel";
import { Card } from "@/components/ui";
import { parseBusinessProfile } from "@/lib/rows";
import { supabaseBrowserResult } from "@/lib/supabase/client";
import { isContentType, type BusinessProfile, type Draft } from "@/lib/types";

type Note = { kind: "error" | "info"; text: string };

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
    !isContentType(item.contentType)
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
  const [value, setValue] = useState<GeneratorPanelProps["value"]>({
    contentType: "social_caption",
    topic: "",
    keywords: [],
  });
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [note, setNote] = useState<Note | null>(null);

  useEffect(() => {
    let active = true;
    void loadProfile().then((result) => {
      if (!active) {
        return;
      }
      setProfile(result.profile);
      setProfileChecked(true);
      if (result.error !== null) {
        setNote({ kind: "error", text: result.error });
      }
    });
    return () => {
      active = false;
    };
  }, []);

  async function generate() {
    setPending(true);
    setNote(null);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
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
    const { error } = await client.value
      .from("generated_content")
      .update({ content_text: text })
      .eq("id", draft.id);
    if (error !== null) {
      setNote({ kind: "error", text: `Could not save your changes: ${error.message}` });
      return;
    }
    setDraft({ ...draft, contentText: text });
    setNote({ kind: "info", text: "Changes saved." });
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
    const { error } = await client.value
      .from("generated_content")
      .update({ rating })
      .eq("id", draft.id);
    if (error !== null) {
      setNote({ kind: "error", text: `Could not save the rating: ${error.message}` });
      return;
    }
    setDraft({ ...draft, rating });
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

      {profileChecked && profile === null ? (
        <Link href="/onboarding" className="text-sm font-medium text-indigo-600 hover:underline">
          Go to business profile
        </Link>
      ) : null}

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

      <Link href="/dashboard" className="inline-block text-sm font-medium text-indigo-600 hover:underline">
        Back to dashboard
      </Link>
    </main>
  );
}