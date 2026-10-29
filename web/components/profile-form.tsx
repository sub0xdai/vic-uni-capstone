"use client";

import { useState } from "react";
import { Button, Field, controlClass } from "@/components/ui";
import { validateProfileDraft, type ProfileField } from "@/lib/profile";
import {
  BRAND_TONE_LABELS,
  BRAND_TONES,
  type BusinessProfileDraft,
  type Result,
} from "@/lib/types";

export type ProfileFormProps = {
  initial?: BusinessProfileDraft | null;
  onSave: (form: FormData) => Promise<Result<null>>;
};

const TEXT_FIELDS: {
  field: Exclude<ProfileField, "brandTone">;
  label: string;
  rows: number;
}[] = [
  { field: "businessName", label: "Business name", rows: 0 },
  { field: "industry", label: "Industry", rows: 0 },
  { field: "description", label: "Description", rows: 3 },
  { field: "targetAudience", label: "Target audience", rows: 3 },
];

export function ProfileForm({ initial = null, onSave }: ProfileFormProps) {
  const [errors, setErrors] = useState<Partial<Record<ProfileField, string>>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const check = validateProfileDraft(form);

    setMessage(null);
    if (check.kind === "invalid") {
      setErrors(check.errors);
      return;
    }

    setErrors({});
    setSaving(true);
    const result = await onSave(form);
    setSaving(false);
    if (!result.ok) {
      setMessage(result.error);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {TEXT_FIELDS.map(({ field, label, rows }) => {
        const error = errors[field];
        const value = initial === null ? "" : initial[field];
        return (
          <Field key={field} label={label} error={error}>
            {rows === 0 ? (
              <input
                name={field}
                defaultValue={value}
                className={controlClass}
                aria-invalid={error !== undefined}
              />
            ) : (
              <textarea
                name={field}
                defaultValue={value}
                rows={rows}
                className={controlClass}
                aria-invalid={error !== undefined}
              />
            )}
          </Field>
        );
      })}

      <Field label="Brand tone" error={errors.brandTone}>
        <select
          name="brandTone"
          defaultValue={initial === null ? "" : initial.brandTone}
          className={controlClass}
          aria-invalid={errors.brandTone !== undefined}
        >
          <option value="">Select a tone</option>
          {BRAND_TONES.map((tone) => (
            <option key={tone} value={tone}>
              {BRAND_TONE_LABELS[tone]}
            </option>
          ))}
        </select>
      </Field>

      {message === null ? null : (
        <p className="text-sm text-red-600" role="alert">
          {message}
        </p>
      )}

      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}
