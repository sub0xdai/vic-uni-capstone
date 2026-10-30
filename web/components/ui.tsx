import type { ReactNode } from "react";
import { invariant } from "@/lib/assert";
import { RATING_MAX, RATING_MIN, isRating } from "@/lib/types";

export const controlClass = [
  "w-full rounded-lg border border-[#d7e2f1] bg-white px-3 py-2.5",
  "text-sm text-neutral-900 outline-none disabled:opacity-50",
  "focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20",
].join(" ");

export function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={
        "rounded-2xl border border-[#e2eaf5] bg-white p-6 " +
        "shadow-[0_4px_22px_rgba(24,55,97,0.06)]"
      }
    >
      <header className="mb-4">
        <h2 className="text-lg font-bold text-neutral-900">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-neutral-900">
        {label}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}

export function Button({
  children,
  variant = "primary",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
}) {
  const styles =
    variant === "primary"
      ? "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300"
      : "border border-[#bcd2ff] bg-white text-indigo-600 hover:bg-indigo-50";
  return (
    <button
      {...rest}
      className={[
        "rounded-lg px-4 py-2.5 text-sm font-bold transition",
        "disabled:cursor-not-allowed",
        styles,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function Stars({
  value,
  onChange,
}: {
  value: number | null;
  onChange?: (next: number) => void;
}) {
  invariant(value === null || isRating(value), `rating out of range: ${String(value)}`);
  invariant(RATING_MAX - RATING_MIN === 4, "rating scale is not five stars");

  return (
    <div className="flex gap-1" role="group" aria-label="Content rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          aria-pressed={value === n}
          disabled={onChange === undefined}
          onClick={() => onChange?.(n)}
          className={`text-xl leading-none ${
            value !== null && n <= value ? "text-amber-500" : "text-neutral-300"
          } ${onChange ? "cursor-pointer hover:text-amber-400" : "cursor-default"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
