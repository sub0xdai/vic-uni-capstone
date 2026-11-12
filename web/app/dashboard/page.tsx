
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BarChart3,
  Building2,
  FileText,
  Heart,
  Plus,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { DraftList } from "@/components/draft-list";
import { QualityCard } from "@/components/quality-card";
import { Stars } from "@/components/ui";
import { parseDraft, parseModelRate } from "@/lib/rows";
import { applyRating } from "@/lib/evaluate";
import { monthlySpend } from "@/lib/usage";
import { reuseHref } from "@/lib/reuse";
import { supabaseBrowserResult } from "@/lib/supabase/client";

import {
  CONTENT_TYPE_LABELS,
  FAVOURITE_MIN_RATING,
  MONTHLY_LIMIT,
  err,
  ok,
  statusCounts,
  type Draft,
  type DraftStatus,
  type ModelRate,
  type Result,
  type StatusFilter,
} from "@/lib/types";

const NOT_SIGNED_IN = "You must be logged in to see your dashboard";

function averageScore(drafts: Draft[]): number | null {
  const scored = drafts.filter((draft) => draft.analysis !== null);

  if (scored.length === 0) return null;

  const total = scored.reduce(
    (sum, draft) => sum + (draft.analysis?.overallScore ?? 0),
    0,
  );

  return Math.round((total / scored.length) * 100);
}

function countThisMonth(drafts: Draft[], now: Date): number {
  return drafts.filter((draft) => {
    const created = new Date(draft.createdAt);

    return (
      created.getUTCFullYear() === now.getUTCFullYear() &&
      created.getUTCMonth() === now.getUTCMonth()
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

function MetricCard({
  label,
  value,
  description,
  icon,
  alert = false,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  alert?: boolean;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {icon}
        </div>
        <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-blue-600" />
      </div>

      <p className="mt-5 text-sm font-medium text-slate-500">{label}</p>

      <p
        className={`mt-1 text-3xl font-bold tracking-tight ${
          alert ? "text-red-600" : "text-slate-900"
        }`}
      >
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-400">{description}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [rates, setRates] = useState<ModelRate[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [now] = useState(() => new Date());

  const load = useCallback(async (): Promise<Result<Draft[]>> => {
    const client = supabaseBrowserResult();

    if (!client.ok) return err(client.error);

    const supabase = client.value;
    const { data: auth, error: authError } =
      await supabase.auth.getUser();

    if (authError !== null) return err(authError.message);

    if (auth.user === null) return err(NOT_SIGNED_IN);

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

      if (!parsed.ok) return err(parsed.error);

      draftsOut.push(parsed.value);
    }

    return ok(draftsOut);
  }, []);

  useEffect(() => {
    let active = true;

    void load().then((result) => {
      if (!active) return;

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

  useEffect(() => {
    let active = true;

    const client = supabaseBrowserResult();

    if (!client.ok) return;

    void client.value
      .from("model_rate")
      .select("*")
      .then(({ data, error }) => {
        if (!active || error !== null || data === null) return;

        const parsed: ModelRate[] = [];

        for (const item of data) {
          const rate = parseModelRate(item);

          if (rate.ok) parsed.push(rate.value);
        }

        setRates(parsed);
      });

    return () => {
      active = false;
    };
  }, []);

  async function remove(id: string) {
    const client = supabaseBrowserResult();

    if (!client.ok) {
      setMessage(client.error);
      return;
    }

    const { error } = await client.value
      .from("generated_content")
      .delete()
      .eq("id", id);

    if (error !== null) {
      setMessage(`Could not delete the draft: ${error.message}`);
      return;
    }

    setDrafts((current) =>
      current.filter((draft) => draft.id !== id),
    );
  }

  async function rate(id: string, rating: number) {
    const client = supabaseBrowserResult();

    if (!client.ok) {
      setMessage(client.error);
      return;
    }

    const target = drafts.find((draft) => draft.id === id);

    if (target === undefined) return;

    const analysis =
      target.analysis === null
        ? null
        : applyRating(target.analysis, rating);

    const { error } = await client.value
      .from("generated_content")
      .update(
        analysis === null ? { rating } : { rating, analysis },
      )
      .eq("id", id);

    if (error !== null) {
      setMessage(`Could not save the rating: ${error.message}`);
      return;
    }

    setDrafts((current) =>
      current.map((draft) =>
        draft.id === id ? { ...draft, rating, analysis } : draft,
      ),
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
      .update({
        status,
        status_changed_at: changedAt,
      })
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
        draft.id === id
          ? { ...draft, status, statusChangedAt: changedAt }
          : draft,
      ),
    );
  }

  function reuse(draft: Draft) {
    router.push(reuseHref(draft));
  }

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#f5f8fe]">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          Loading your dashboard...
        </div>
      </main>
    );
  }

  if (message === NOT_SIGNED_IN) {
    return (
      <main className="mx-auto w-full max-w-md p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">{message}</p>
          <Link
            href="/login"
            className="mt-5 inline-block rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
          >
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  const average = averageScore(drafts);
  const latest = drafts.at(0) ?? null;
  const notice = message === NOT_SIGNED_IN ? null : message;

  const usedThisMonth = countThisMonth(drafts, now);
  const limitReached = usedThisMonth >= MONTHLY_LIMIT;

  const favourites = favouriteDrafts(drafts);
  const spend = monthlySpend(drafts, rates, now);
  const counts = statusCounts(drafts);

  const visible =
    filter === "all"
      ? drafts
      : drafts.filter((draft) => draft.status === filter);

  const costLine =
    spend.cost === null
      ? "No rate on record for this model."
      : `Estimated cost $${spend.cost < 0.01 ? spend.cost.toFixed(6) : spend.cost.toFixed(4)}.`;

  return (
    <main className="min-h-screen bg-[#f5f8fe] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-[1440px] space-y-8">

        {/* Welcome section */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#155eef] via-[#3478f6] to-[#6499ff] p-7 text-white shadow-[0_12px_40px_rgba(37,99,235,0.20)] sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[35px] border-white/10" />
          <div className="pointer-events-none absolute -bottom-36 right-48 h-72 w-72 rounded-full bg-white/5" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              AI-powered marketing workspace
            </div>

            <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Your content dashboard
            </h1>

            <p className="mt-3 max-w-lg text-sm leading-6 text-blue-50 sm:text-base">
              Create, organise and manage your business marketing content
              from one place.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/generate"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50"
              >
                <WandSparkles className="h-4 w-4" />
                Generate content
                <ArrowUpRight className="h-4 w-4" />
              </Link>

              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                <Building2 className="h-4 w-4" />
                Business profile
              </Link>
            </div>
          </div>
        </section>

        {/* Dashboard heading */}
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
                Workspace overview
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Your performance
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                A snapshot of your content activity and usage.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              label="Total drafts"
              value={String(drafts.length)}
              description="All your generated content"
              icon={<FileText className="h-5 w-5" />}
            />

            <MetricCard
              label="Average quality"
              value={average === null ? "-" : `${average}%`}
              description="Based on your evaluated drafts"
              icon={<BarChart3 className="h-5 w-5" />}
            />

            <MetricCard
              label="Monthly generations"
              value={`${usedThisMonth} / ${MONTHLY_LIMIT}`}
              description={
                limitReached
                  ? "Monthly generation limit reached"
                  : "Your current monthly usage"
              }
              icon={<Sparkles className="h-5 w-5" />}
              alert={limitReached}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-slate-200/80 bg-white px-5 py-4 text-xs text-slate-500 shadow-sm">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            <span className="font-semibold text-slate-700">
              Monthly API usage
            </span>
            <span>
              {spend.tokens.inputTokens.toLocaleString()} input tokens
            </span>
            <span className="text-slate-300">|</span>
            <span>
              {spend.tokens.outputTokens.toLocaleString()} output tokens
            </span>
            <span className="text-slate-300">|</span>
            <span>{costLine}</span>
          </div>

          {limitReached && (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              You have reached your monthly generation limit.
            </p>
          )}
        </section>

        {/* Favourites */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Top favourites</h2>
                <p className="text-xs text-slate-500">
                  Your highest-rated content
                </p>
              </div>
            </div>

            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
              {favourites.length} favourites
            </span>
          </div>

          <div className="p-6">
            {favourites.length === 0 ? (
              <div className="py-5 text-center">
                <Heart className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-600">
                  No favourites yet
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Rate a draft 4 or 5 stars and it will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {favourites.map((draft) => (
                  <li
                    key={draft.id}
                    className="flex flex-wrap items-center gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {draft.topic}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {CONTENT_TYPE_LABELS[draft.contentType]}
                        {draft.analysis === null
                          ? ""
                          : ` · Quality ${Math.round(draft.analysis.overallScore * 100)}%`}
                      </p>
                    </div>

                    <Stars value={draft.rating} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Generated content */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">
                  Generated content
                </h2>
                <p className="text-xs text-slate-500">
                  Manage and organise your drafts
                </p>
              </div>
            </div>

            <Link
              href="/generate"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New content
            </Link>
          </div>

          <div className="p-5 sm:p-6">
            <DraftList
              drafts={visible}
              filter={filter}
              counts={counts}
              onFilter={setFilter}
              onDelete={remove}
              onRate={rate}
              onStatus={changeStatus}
              onReuse={reuse}
            />
          </div>
        </section>

        {/* Latest draft quality */}
        {latest === null ? null : (
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">
                  Latest draft quality
                </h2>
                <p className="text-xs text-slate-500">{latest.topic}</p>
              </div>
            </div>

            <div className="p-6">
              <QualityCard
                report={latest.analysis}
                contentType={latest.contentType}
                text={latest.contentText}
              />
            </div>
          </section>
        )}

        {notice === null ? null : (
          <p
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            role="alert"
          >
            {notice}
          </p>
        )}

        <footer className="pb-5 text-center text-xs text-slate-400">
          ContentCraft · Your AI-powered marketing workspace
        </footer>
      </div>
    </main>
  );
}
