"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DraftList } from "@/components/draft-list";
import { QualityCard } from "@/components/quality-card";
import { Card } from "@/components/ui";
import { parseDraft } from "@/lib/rows";
import { supabaseBrowserResult } from "@/lib/supabase/client";
import { err, ok, type Draft, type Result } from "@/lib/types";

const NOT_SIGNED_IN = "You must be logged in to see your dashboard";

const CTA =
  "mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white";

function averageScore(drafts: Draft[]): number | null {
  const scored = drafts.filter((draft) => draft.analysis !== null);
  if (scored.length === 0) {
    return null;
  }
  const total = scored.reduce((sum, draft) => sum + (draft.analysis?.overallScore ?? 0), 0);
  return Math.round((total / scored.length) * 100);
}

export default function DashboardPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (): Promise<Result<Draft[]>> => {
    const client = supabaseBrowserResult();
    if (!client.ok) {
      return err(client.error);
    }
    const supabase = client.value;
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError !== null) {
      return err(authError.message);
    }
    if (auth.user === null) {
      return err(NOT_SIGNED_IN);
    }

    const { data, error } = await supabase
      .from("generated_content")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (error !== null) {
      return err(`Could not load content: ${error.message}`);
    }

    const draftsOut: Draft[] = [];
    for (const item of data) {
      const parsed = parseDraft(item);
      if (!parsed.ok) {
        return err(parsed.error);
      }
      draftsOut.push(parsed.value);
    }
    return ok(draftsOut);
  }, []);

  useEffect(() => {
    let active = true;
    void load().then((result) => {
      if (!active) {
        return;
      }
      setLoading(false);
      if (result.ok) {
        setDrafts(result.value);
        return;
      }
      setMessage(result.error);
    });
    return () => {
      active = false;
    };
  }, [load]);

  async function remove(id: string) {
    const client = supabaseBrowserResult();
    if (!client.ok) {
      setMessage(client.error);
      return;
    }
    const { error } = await client.value.from("generated_content").delete().eq("id", id);
    if (error !== null) {
      setMessage(`Could not delete the draft: ${error.message}`);
      return;
    }
    setDrafts((current) => current.filter((draft) => draft.id !== id));
  }

  async function rate(id: string, rating: number) {
    const client = supabaseBrowserResult();
    if (!client.ok) {
      setMessage(client.error);
      return;
    }
    const { error } = await client.value
      .from("generated_content")
      .update({ rating })
      .eq("id", id);
    if (error !== null) {
      setMessage(`Could not save the rating: ${error.message}`);
      return;
    }
    setDrafts((current) =>
      current.map((draft) => (draft.id === id ? { ...draft, rating } : draft)),
    );
  }

  if (loading) {
    return <p className="p-6 text-sm text-neutral-500">Loading...</p>;
  }

  if (message === NOT_SIGNED_IN) {
    return (
      <main className="mx-auto w-full max-w-md p-6">
        <Card title="Dashboard" subtitle="Log in to see your generated content.">
          <p className="text-sm text-neutral-700">{message}</p>
          <Link href="/login" className={CTA}>
            Go to login
          </Link>
        </Card>
      </main>
    );
  }

  const average = averageScore(drafts);
  const latest = drafts.at(0) ?? null;
  const notice = message === NOT_SIGNED_IN ? null : message;

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <Card title="Overview">
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-neutral-500">Total drafts</dt>
            <dd className="text-2xl font-semibold text-neutral-900">{drafts.length}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-neutral-500">
              Average quality
            </dt>
            <dd className="text-2xl font-semibold text-neutral-900">
              {average === null ? "-" : `${average}%`}
            </dd>
          </div>
        </dl>
        <Link
          href="/onboarding"
          className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
        >
          Edit business profile
        </Link>
      </Card>

      <Card title="Generated content" subtitle="Newest first.">
        <DraftList drafts={drafts} onDelete={remove} onRate={rate} />
      </Card>

      {latest === null ? null : (
        <Card title="Latest draft quality" subtitle={latest.topic}>
          <QualityCard report={latest.analysis} />
        </Card>
      )}

      {notice === null ? null : (
        <p className="text-sm text-red-600" role="alert">
          {notice}
        </p>
      )}
    </main>
  );
}
