import test from "node:test";
import assert from "node:assert/strict";
import { validateProfileDraft } from "./profile.ts";
import { INDUSTRIES } from "./types.ts";

function formOf(fields: Record<string, string>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    form.set(key, value);
  }
  return form;
}

const FILLED = {
  businessName: "Footscray Coffee Roasters",
  industry: "Hospitality",
  description: "Small batch coffee roaster and cafe.",
  targetAudience: "Local coffee drinkers.",
  brandTone: "friendly",
};

test("an empty submit reports every field", () => {
  const check = validateProfileDraft(formOf({}));
  assert.equal(check.kind, "invalid");
  if (check.kind === "invalid") {
    assert.deepEqual(Object.keys(check.errors).sort(), [
      "brandTone",
      "businessName",
      "description",
      "industry",
      "targetAudience",
    ]);
    assert.equal(check.errors.businessName, "Business name is required");
  }
});

test("whitespace alone does not satisfy a required field", () => {
  const check = validateProfileDraft(formOf({ ...FILLED, industry: "   " }));
  assert.equal(check.kind, "invalid");
  if (check.kind === "invalid") {
    assert.deepEqual(Object.keys(check.errors), ["industry"]);
  }
});

test("every listed industry is accepted", () => {
  for (const industry of INDUSTRIES) {
    const check = validateProfileDraft(formOf({ ...FILLED, industry }));
    assert.equal(check.kind, "valid", industry);
  }
});

test("an industry that is not on the list is refused", () => {
  const check = validateProfileDraft(formOf({ ...FILLED, industry: "Cafe" }));
  assert.equal(check.kind, "invalid");
  if (check.kind === "invalid") {
    assert.equal(check.errors.industry, "Choose an industry from the list");
  }
});

test("a filled form yields the draft with a lowercase tone", () => {
  const check = validateProfileDraft(formOf(FILLED));
  assert.equal(check.kind, "valid");
  if (check.kind === "valid") {
    assert.deepEqual(check.draft, FILLED);
    assert.equal(check.draft.brandTone, "friendly");
  }
});

test("a capitalised tone never reaches the enum", () => {
  const check = validateProfileDraft(formOf({ ...FILLED, brandTone: "Friendly" }));
  assert.equal(check.kind, "invalid");
  if (check.kind === "invalid") {
    assert.ok(check.errors.brandTone?.includes("unknown brand tone"));
  }
});

test("surrounding whitespace is trimmed before it reaches the database", () => {
  const check = validateProfileDraft(formOf({ ...FILLED, businessName: "  Acme  " }));
  assert.equal(check.kind, "valid");
  if (check.kind === "valid") {
    assert.equal(check.draft.businessName, "Acme");
  }
});
