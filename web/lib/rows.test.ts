import test from "node:test";
import assert from "node:assert/strict";
import { parseBusinessProfile, parseDraft, parseQualityReport } from "./rows.ts";

const PROFILE_ROW = {
  id: "00000000-0000-0000-0000-000000000001",
  user_id: "00000000-0000-0000-0000-000000000002",
  business_name: "Footscray Coffee Roasters",
  industry: "Hospitality",
  description: "Small batch coffee roaster and cafe.",
  target_audience: "Local coffee drinkers.",
  brand_tone: "friendly",
};

const DRAFT_ROW = {
  id: "00000000-0000-0000-0000-000000000003",
  user_id: "00000000-0000-0000-0000-000000000002",
  content_type: "social_caption",
  topic: "Single origin launch",
  keywords: ["single origin", "Ethiopia"],
  content_text: "Something new just landed.",
  rating: 4,
  analysis: {
    readabilityScore: 0.7,
    toneScore: 0.6,
    keywordScore: 1,
    structureScore: 0.7,
    userSatisfactionScore: 0.7,
    overallScore: 0.74,
  },
  model: "gpt-4o-mini",
  temperature: "0.7",
  system_prompt: "system",
  user_prompt: "user",
  created_at: "2026-10-02T09:00:00Z",
};

test("a complete profile row parses", () => {
  const parsed = parseBusinessProfile(PROFILE_ROW);
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.value.brandTone, "friendly");
    assert.equal(parsed.value.businessName, "Footscray Coffee Roasters");
  }
});

test("a capitalised brand tone is rejected instead of reaching the enum", () => {
  const parsed = parseBusinessProfile({ ...PROFILE_ROW, brand_tone: "Friendly" });
  assert.equal(parsed.ok, false);
});

test("a uuid id stays a string", () => {
  const parsed = parseDraft({ ...DRAFT_ROW, id: "00000000-0000-0000-0000-0000000000ff" });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(typeof parsed.value.id, "string");
  }
});

test("a row without analysis parses with a null score", () => {
  const parsed = parseDraft({ ...DRAFT_ROW, analysis: null });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.value.analysis, null);
    assert.equal(parsed.value.rating, 4);
  }
});

test("numeric temperature arrives as text and still parses", () => {
  const parsed = parseDraft(DRAFT_ROW);
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.value.parameters?.temperature, 0.7);
  }
});

test("a quality report outside zero to one is rejected", () => {
  assert.equal(parseQualityReport({ ...DRAFT_ROW.analysis, overallScore: 74 }), null);
  assert.equal(parseQualityReport({ ...DRAFT_ROW.analysis, toneScore: -1 }), null);
  assert.equal(parseQualityReport(undefined), null);
});

test("a row missing a required column is rejected", () => {
  const { content_text: _omitted, ...rest } = DRAFT_ROW;
  assert.equal(parseDraft(rest).ok, false);
});
