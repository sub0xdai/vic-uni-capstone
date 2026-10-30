"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DraftList } from "@/components/draft-list";
import { QualityCard } from "@/components/quality-card";
import { Card, Stars } from "@/components/ui";
import { parseDraft } from "@/lib/rows";
import { supabaseBrowserResult } from "@/lib/supabase/client";
import {
  CONTENT_TYPE_LABELS,
  FAVOURITE_MIN_RATING,
  MONTHLY_LIMIT,
  err,
  ok,
  type Draft,
  type DraftStatus,
  type Result,
} from "@/lib/types";

const NOT_SIGNED_IN = "You must be logged in to see your dashboard";

const CTA =
  "mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700";

function averageScore(drafts: Draft[]): number | null {
  const scored = drafts.filter((draft) => draft.analysis !== null);
  if (scored.length === 0) {
    return null;
  }
  const total = scored.reduce((sum, draft) => sum + (draft.analysis?.overallScore ?? 0), 0);
  return Math.round((total / scored.length) * 100);
}

function countThisMonth(drafts: Draft[], now: Date): number {
  return drafts.filter((draft) => {
    const created = new Date(draft.createdAt);
    return (
      created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth()
    );
  }).length;
}

function favouriteDrafts(drafts: Draft[]): Draft[] {
  return drafts.filter(
    (draft) =>
      draft.status !== "discarded" &&
      draft.rating !== null &&
      draft.rating >= FAVOURITE_MIN_RATING,
  );
}

function Tile({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className="rounded-xl bg-indigo-50 p-4 text-center">
      <dd
        className={`text-3xl font-extrabold ${alert ? "text-red-600" : "text-indigo-600"}`}
      >
        {value}
      </dd>
      <dt className="mt-1 text-xs font-medium text-slate-500">{label}</dt>
    </div>
  );
}

export default function DashboardPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [now] = useState(() => new Date());

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

  async function changeStatus(id: string, status: DraftStatus) {
    const client = supabaseBrowserResult();
    if (!client.ok) {
      setMessage(client.error);
      return;
    }
    const changedAt = new Date().toISOString();
    const { data, error } = await client.value
      .from("generated_content")
      .update({ status, status_changed_at: changedAt })
      .eq("id", id)
      .select("id");
    if (error !== null) {
      setMessage(`Could not update the status: ${error.message}`);
      return;
    }
    if (data.length === 0) {
      setMessage("Could not update the status: draft not found.");
      return;
    }
    setDrafts((current) =>
      current.map((draft) =>
        draft.id === id ? { ...draft, status, statusChangedAt: changedAt } : draft,
      ),
    );
  }

  if (loading) {
    return <p className="p-6 text-sm text-slate-500">Loading...</p>;
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
  const usedThisMonth = countThisMonth(drafts, now);
  const limitReached = usedThisMonth >= MONTHLY_LIMIT;
  const favourites = favouriteDrafts(drafts);

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <section className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-500 p-8 text-white shadow-[0_8px_30px_rgba(20,100,244,0.25)]">
        <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
          AI-powered for small businesses
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Your content dashboard</h1>
        <p className="mt-2 max-w-xl text-sm text-white/80">
          Track your drafts, favourites and monthly usage in one place.
        </p>
        <Link
          href="/onboarding"
          className="mt-5 inline-block rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50"
        >
          Edit business profile
        </Link>
      </section>

      <Card title="Overview">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Tile label="Total drafts" value={String(drafts.length)} />
          <Tile
            label="Average quality"
            value={average === null ? "-" : `${average}%`}
          />
          <Tile
            label="Generated this month"
            value={`${usedThisMonth} / ${MONTHLY_LIMIT}`}
            alert={limitReached}
          />
        </dl>
        {limitReached ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            You have reached your monthly generation limit.
          </p>
        ) : null}
      </Card>

      <Card title="Top favourites" subtitle="Drafts you rated 4 or 5 stars.">
        {favourites.length === 0 ? (
          <p className="text-sm text-slate-500">
            Rate a draft 4 or 5 stars and it will show up here.
          </p>
        ) : (
          <ul>
            {favourites.map((draft) => (
              <li
                key={draft.id}
                className="flex flex-wrap items-center gap-4 border-b border-[#e2eaf5] py-3 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-neutral-900">{draft.topic}</p>
                  <p className="text-xs text-slate-500">
                    {CONTENT_TYPE_LABELS[draft.contentType]}
                    {draft.analysis === null
                      ? ""
                      : ` - quality ${Math.round(draft.analysis.overallScore * 100)}%`}
                  </p>
                </div>
                <Stars value={draft.rating} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Generated content" subtitle="Newest first.">
        <DraftList
          drafts={drafts}
          onDelete={remove}
          onRate={rate}
          onStatus={changeStatus}
        />
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