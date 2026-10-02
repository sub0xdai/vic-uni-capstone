"use client";

import type { Result } from "@/lib/types";

export type ProfileFormProps = {
  onSave: (form: FormData) => Promise<Result<null>>;
};

export function ProfileForm(_props: ProfileFormProps) {
  return (
    <div className="rounded-xl border-2 border-dashed border-amber-400/70 bg-amber-50/60 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
        W2.1 not built
      </p>
      <p className="mt-1 text-base font-semibold text-neutral-900">
        Brand profile form
      </p>
      <ul className="mt-3 space-y-1 text-sm text-neutral-700">
        <li>- Business name, text input, required</li>
        <li>- Industry, text input, required</li>
        <li>- Description, textarea, required</li>
        <li>- Target audience, textarea, required</li>
        <li>- Brand tone, select of Professional, Casual, Friendly</li>
        <li>- Save button, inline error under the field that is empty</li>
      </ul>
    </div>
  );
}
