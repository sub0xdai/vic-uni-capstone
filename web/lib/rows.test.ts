import test from "node:test";
import assert from "node:assert/strict";
import {
  parseBusinessProfile,
  parseDraft,
  parseModelRate,
  parseQualityReport,
  parseUsage,
} from "./rows.ts";

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

test("a row without a status defaults to draft", () => {
  const parsed = parseDraft(DRAFT_ROW);
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.value.status, "draft");
    assert.equal(parsed.value.statusChangedAt, null);
  }
});

test("a published row keeps its status and change time", () => {
  const parsed = parseDraft({
    ...DRAFT_ROW,
    status: "published",
    status_changed_at: "2026-10-03T10:00:00Z",
  });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.value.status, "published");
    assert.equal(parsed.value.statusChangedAt, "2026-10-03T10:00:00Z");
  }
});

test("an unknown status falls back to draft", () => {
  const parsed = parseDraft({ ...DRAFT_ROW, status: "archived" });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.value.status, "draft");
  }
});

test("usage is read from the row and absent usage is null, not zero", () => {
  const withUsage = parseDraft({ ...DRAFT_ROW, usage: { inputTokens: 190, outputTokens: 240 } });
  assert.equal(withUsage.ok, true);
  if (withUsage.ok) {
    assert.deepEqual(withUsage.value.usage, { inputTokens: 190, outputTokens: 240 });
  }
  const without = parseDraft(DRAFT_ROW);
  assert.equal(without.ok, true);
  if (without.ok) {
    assert.equal(without.value.usage, null);
  }
});

test("a malformed usage object reads as absent rather than as zero", () => {
  assert.equal(parseUsage({ inputTokens: 10 }), null);
  assert.equal(parseUsage({ inputTokens: "10", outputTokens: 20 }), null);
  assert.equal(parseUsage({ inputTokens: -1, outputTokens: 20 }), null);
  assert.equal(parseUsage(null), null);
  assert.deepEqual(parseUsage({ inputTokens: 10, outputTokens: 20 }), {
    inputTokens: 10,
    outputTokens: 20,
  });
});

test("a rate row needs a model and two non-negative prices", () => {
  const good = { model: "m", input_per_million: 0.1, output_per_million: 0.4 };
  assert.equal(parseModelRate(good).ok, true);
  assert.equal(parseModelRate({ ...good, model: undefined }).ok, false);
  assert.equal(parseModelRate({ ...good, input_per_million: undefined }).ok, false);
  assert.equal(parseModelRate({ ...good, input_per_million: -1 }).ok, false);
});