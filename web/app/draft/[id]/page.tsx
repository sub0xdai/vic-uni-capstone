"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DraftEditor } from "@/components/draft-editor";
import { DraftPreview } from "@/components/draft-preview";
import { PromptPanel } from "@/components/prompt-panel";
import { QualityCard } from "@/components/quality-card";
import { Button, Card } from "@/components/ui";
import { planDraftSave } from "@/lib/draft-save";
import { applyRating } from "@/lib/evaluate";
import { parseBusinessProfile, parseDraft } from "@/lib/rows";
import { supabaseBrowserResult } from "@/lib/supabase/client";
import {
  CONTENT_TYPE_LABELS,
  DRAFT_STATUS_LABELS,
  err,
  ok,
  type BrandTone,
  type Draft,
  type DraftStatus,
  type Result,
} from "@/lib/types";

const NOT_SIGNED_IN = "You must be logged in to read a draft";
const NOT_FOUND = "That draft is not here.";

type LoadedDraft = {
  draft: Draft | null;
  brandTone: BrandTone | null;
};

const CTA =
  "mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white " +
  "hover:bg-indigo-700";

export default function DraftPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const [loaded, setLoaded] = useState<LoadedDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<{ kind: "error" | "info"; text: string } | null>(null);

  const load = useCallback(async (): Promise<Result<LoadedDraft>> => {
    const client = supabaseBrowserResult();
    if (!client.ok) {
      return err(client.error);
    }
    if (id.length === 0) {
      return ok({ draft: null, brandTone: null });
    }
    const { data: auth, error: authError } = await client.value.auth.getUser();
    if (authError !== null) {
      return err(authError.message);
    }
    if (auth.user === null) {
      return err(NOT_SIGNED_IN);
    }
    const { data, error } = await client.value
      .from("generated_content")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error !== null) {
      return err(`Could not load the draft: ${error.message}`);
    }
    if (data === null) {
      return ok({ draft: null, brandTone: null });
    }
    const draft = parseDraft(data);
    if (!draft.ok) {
      return err(draft.error);
    }
    const { data: profileRow } = await client.value
      .from("business_profile")
      .select("*")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    const profile = profileRow === null ? null : parseBusinessProfile(profileRow);
    return ok({
      draft: draft.value,
      brandTone: profile !== null && profile.ok ? profile.value.brandTone : null,
    });
  }, [id]);

  useEffect(() => {
    let active = true;
    void load().then((result) => {
      if (!active) {
        return;
      }
      setLoading(false);
      if (result.ok) {
        setLoaded(result.value);
        return;
      }
      setNote({ kind: "error", text: result.error });
    });
    return () => {
      active = false;
    };
  }, [load]);

  const draft = loaded?.draft ?? null;

  async function save(text: string) {
    if (draft === null || loaded === null) {
      return;
    }
    const client = supabaseBrowserResult();
    if (!client.ok) {
      setNote({ kind: "error", text: client.error });
      return;
    }
    const plan = planDraftSave(draft, text, loaded.brandTone);
    const { error } = await client.value
      .from("generated_content")
      .update({ content_text: text, analysis: plan.analysis })
      .eq("id", draft.id);
    if (error !== null) {
      setNote({ kind: "error", text: `Could not save your changes: ${error.message}` });
      return;
    }
    setLoaded({ ...loaded, draft: { ...draft, contentText: text, analysis: plan.analysis } });
    setNote(
      plan.outcome.kind === "rescored"
        ? { kind: "info", text: "Changes saved." }
        : { kind: "error", text: `Saved, but the score was not updated: ${plan.outcome.reason}.` },
    );
  }

  async function rate(rating: number) {
    if (draft === null || loaded === null) {
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
    setLoaded({ ...loaded, draft: { ...draft, rating, analysis } });
  }

  async function changeStatus(status: DraftStatus) {
    if (draft === null || loaded === null) {
      return;
    }
    const client = supabaseBrowserResult();
    if (!client.ok) {
      setNote({ kind: "error", text: client.error });
      return;
    }
    const statusChangedAt = new Date().toISOString();
    const { data, error } = await client.value
      .from("generated_content")
      .update({ status, status_changed_at: statusChangedAt })
      .eq("id", draft.id)
      .select("id");
    if (error !== null) {
      setNote({ kind: "error", text: `Could not update the status: ${error.message}` });
      return;
    }
    if (data.length === 0) {
      setNote({ kind: "error", text: "Could not update the status: draft not found." });
      return;
    }
    setLoaded({ ...loaded, draft: { ...draft, status, statusChangedAt } });
  }

  if (loading) {
    return <p className="p-6 text-sm text-slate-500">Loading...</p>;
  }

  if (note !== null && note.kind === "error" && draft === null) {
    return (
      <main className="mx-auto w-full max-w-md p-6">
        <Card title="Draft" subtitle="This page could not open the draft.">
          <p className="text-sm text-neutral-700">{note.text}</p>
          <Link href={note.text === NOT_SIGNED_IN ? "/login" : "/dashboard"} className={CTA}>
            {note.text === NOT_SIGNED_IN ? "Go to login" : "Back to dashboard"}
          </Link>
        </Card>
      </main>
    );
  }

  if (draft === null) {
    return (
      <main className="mx-auto w-full max-w-md p-6">
        <Card title="Draft" subtitle="Nothing to show.">
          <p className="text-sm text-neutral-700">{NOT_FOUND}</p>
          <Link href="/dashboard" className={CTA}>
            Back to dashboard
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900">
            {draft.topic}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {`${CONTENT_TYPE_LABELS[draft.contentType]} - ${DRAFT_STATUS_LABELS[draft.status]}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={draft.status === "published"}
            onClick={() => {
              void changeStatus("published");
            }}
          >
            Mark ready
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={draft.status === "discarded"}
            onClick={() => {
              void changeStatus("discarded");
            }}
          >
            Discard
          </Button>
        </div>
      </header>

      {note === null ? null : (
        <p
          className={`text-sm ${note.kind === "error" ? "text-red-600" : "text-emerald-700"}`}
          role={note.kind === "error" ? "alert" : "status"}
        >
          {note.text}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="The draft" subtitle="Edit, save, copy or rate it.">
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

        <Card title="Preview" subtitle="What the reader will see, in this format.">
          <DraftPreview contentType={draft.contentType} text={draft.contentText} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Quality" subtitle="What the scorer said about this draft.">
          <QualityCard report={draft.analysis} />
        </Card>

        <Card
          title="How this draft was made"
          subtitle="The prompt text stored with the draft, and the version that produced it."
        >
          <PromptPanel parameters={draft.parameters} />
        </Card>
      </div>

      <Link
        href="/dashboard"
        className="inline-block text-sm font-medium text-indigo-600 hover:underline"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
