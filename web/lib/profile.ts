import { parseBrandTone, type BusinessProfileDraft } from "./types.ts";

export type ProfileField = keyof BusinessProfileDraft;

export type ProfileDraftCheck =
  | { kind: "invalid"; errors: Partial<Record<ProfileField, string>> }
  | { kind: "valid"; draft: BusinessProfileDraft };

const REQUIRED: { field: Exclude<ProfileField, "brandTone">; label: string }[] = [
  { field: "businessName", label: "Business name" },
  { field: "industry", label: "Industry" },
  { field: "description", label: "Description" },
  { field: "targetAudience", label: "Target audience" },
];

function value(form: FormData, key: ProfileField): string {
  const raw = form.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

export function validateProfileDraft(form: FormData): ProfileDraftCheck {
  const errors: Partial<Record<ProfileField, string>> = {};

  for (const { field, label } of REQUIRED) {
    if (value(form, field).length === 0) {
      errors[field] = `${label} is required`;
    }
  }

  const rawTone = value(form, "brandTone");
  const tone = parseBrandTone(rawTone);
  if (rawTone.length === 0) {
    errors.brandTone = "Brand tone is required";
  } else if (!tone.ok) {
    errors.brandTone = tone.error;
  }

  if (!tone.ok || Object.keys(errors).length > 0) {
    return { kind: "invalid", errors };
  }

  return {
    kind: "valid",
    draft: {
      businessName: value(form, "businessName"),
      industry: value(form, "industry"),
      description: value(form, "description"),
      targetAudience: value(form, "targetAudience"),
      brandTone: tone.value,
    },
  };
}
