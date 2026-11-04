import assert from "node:assert/strict";
import test from "node:test";
import {
  applyRating,
  evaluateDraft,
  keywordCoverage,
  readabilityScore,
  rescoreText,
  satisfactionFrom,
  structureParts,
  structureScore,
  toneAlignment,
} from "./evaluate.ts";
import { assertQualityReport, weightedScore } from "./score.ts";
import {
  QUALITY_METRICS,
  QUALITY_THRESHOLD,
  SOCIAL_CAPTION_MAX,
  type Draft,
  type QualityReport,
} from "./types.ts";

const BLOG = `Introduction
We help cafe owners fill quiet afternoons.
Three Ways To Fill A Quiet Tuesday
1. Run a tasting flight for regulars.
2. Pair a pastry with every coffee sold after two.
3. Invite the local book club to host its meeting here.
Conclusion
Book a tasting flight this week and see the difference.`;

const SOCIAL =
  "Quiet Tuesday? Bring a friend and try our new single origin flight this week.";

const EMAIL = `Subject: A quieter Tuesday, solved
Preview: Three ways to fill the afternoon
Hi there, here are three ways to fill a slow afternoon.
Button: Book a tasting flight`;

test("every metric lands between 0 and 1", () => {
  const result = evaluateDraft({
    contentText: BLOG,
    contentType: "blog_outline",
    keywords: ["cafe", "tasting"],
    brandTone: "friendly",
    rating: null,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  for (const metric of QUALITY_METRICS) {
    const value = result.value[metric];
    assert.ok(value >= 0 && value <= 1, `${metric} out of range: ${value}`);
  }
  assert.ok(result.value.overallScore >= 0 && result.value.overallScore <= 1);
});

test("overall score is the weighted score, not an opinion", () => {
  const result = evaluateDraft({
    contentText: BLOG,
    contentType: "blog_outline",
    keywords: ["cafe"],
    brandTone: "professional",
    rating: 4,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.ok(Math.abs(result.value.overallScore - weightedScore(result.value)) < 1e-9);
});

test("a threshold is a comparison on that same number", () => {
  const result = evaluateDraft({
    contentText: BLOG,
    contentType: "blog_outline",
    keywords: ["cafe"],
    brandTone: "friendly",
    rating: 5,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(
    result.value.overallScore < QUALITY_THRESHOLD,
    result.value.overallScore < 0.6,
  );
});

test("keyword coverage counts the keywords actually present", () => {
  assert.equal(keywordCoverage("a tasting flight in a cafe", ["tasting", "cafe"]), 1);
  assert.equal(keywordCoverage("a tasting flight", ["tasting", "roastery"]), 0.5);
  assert.equal(keywordCoverage("nothing relevant here", ["tasting"]), 0);
  assert.equal(keywordCoverage("anything at all", []), 1);
});

test("structure checks follow the content type", () => {
  assert.equal(structureScore(BLOG, "blog_outline"), 1);
  assert.equal(structureScore("no intro and no closing section", "blog_outline"), 0);
  assert.equal(structureScore(SOCIAL, "social_caption"), 1);
  assert.ok(structureScore(`try us ${"x".repeat(300)}`, "social_caption") < 1);
  assert.equal(structureScore(EMAIL, "email_newsletter"), 1);
  assert.ok(structureScore("just a paragraph of prose", "email_newsletter") < 1);
});

test("tone alignment prefers the copy that matches the chosen voice", () => {
  const formal = "The committee will consider the proposal at its next meeting.";
  const warm = "Hey folks, we'd love you to try this one! It's super good.";
  assert.ok(toneAlignment(formal, "professional") > toneAlignment(formal, "friendly"));
  assert.ok(toneAlignment(warm, "friendly") > toneAlignment(warm, "professional"));
});

test("readability rises as the sentences get shorter", () => {
  const plain = "We sell coffee. It is good. You will like it.";
  const dense =
    "Notwithstanding the aforementioned considerations, the procurement " +
    "framework necessitates comprehensive re-evaluation prior to authorisation.";
  assert.ok(readabilityScore(plain) > readabilityScore(dense));
});

test("satisfaction comes from the rating and nowhere else", () => {
  assert.equal(satisfactionFrom(null), 0.5);
  assert.equal(satisfactionFrom(5), 1);
  assert.equal(satisfactionFrom(1), 0.2);
  assert.throws(() => satisfactionFrom(6));
});

test("an empty or tiny draft is refused instead of scored", () => {
  const empty = evaluateDraft({
    contentText: "   ",
    contentType: "social_caption",
    keywords: [],
    brandTone: "casual",
    rating: null,
  });
  assert.equal(empty.ok, false);
  const tiny = evaluateDraft({
    contentText: "Buy now",
    contentType: "social_caption",
    keywords: [],
    brandTone: "casual",
    rating: null,
  });
  assert.equal(tiny.ok, false);
});

function unrated(): QualityReport {
  const result = evaluateDraft({
    contentText: BLOG,
    contentType: "blog_outline",
    keywords: ["tasting flight"],
    brandTone: "casual",
    rating: null,
  });
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.value;
}

test("a rating recomputes the overall score and leaves the other metrics alone", () => {
  const before = unrated();
  const after = applyRating(before, 5);
  assert.equal(after.userSatisfactionScore, 1);
  assert.ok(Math.abs(after.overallScore - before.overallScore - 0.175) < 1e-9);
  assert.equal(after.readabilityScore, before.readabilityScore);
  assert.equal(after.toneScore, before.toneScore);
  assert.equal(after.keywordScore, before.keywordScore);
  assert.equal(after.structureScore, before.structureScore);
  assertQualityReport(after);
});

test("a low rating lowers the score by the weight satisfaction carries", () => {
  const before = unrated();
  const after = applyRating(before, 1);
  assert.equal(after.userSatisfactionScore, 0.2);
  assert.ok(Math.abs(before.overallScore - after.overallScore - 0.105) < 1e-9);
  assertQualityReport(after);
});

test("a rating outside the scale is refused instead of written", () => {
  const report = unrated();
  assert.throws(() => applyRating(report, 0));
  assert.throws(() => applyRating(report, 6));
  assert.throws(() => applyRating(report, 3.5));
});

test("a report whose overall score had drifted is refused before it is rewritten", () => {
  const report = unrated();
  const drifted: QualityReport = { ...report, overallScore: report.overallScore + 0.2 };
  assert.throws(() => applyRating(drifted, 5));
});

function draft(overrides: Partial<Draft> = {}): Draft {
  return {
    id: "d1",
    userId: "u1",
    contentType: "social_caption",
    topic: "Quiet Tuesday",
    keywords: ["tasting"],
    contentText: SOCIAL,
    rating: 5,
    status: "draft",
    statusChangedAt: null,
    analysis: null,
    parameters: null,
    usage: null,
    createdAt: "2026-11-05T09:00:00.000Z",
    ...overrides,
  };
}

const TOO_LONG =
  "Quiet Tuesday? Bring a friend and try our new single origin flight this week. " +
  "We roast in small batches every Monday, and the shelf is always changing. " +
  "Book a tasting flight and tell us which one you liked best. " +
  "Regulars get first pick of the Monday roast, so ask at the counter this week.";

test("saving an edit rescores the new text and keeps the rating", () => {
  const edited = rescoreText(draft(), TOO_LONG, "friendly");
  assert.equal(edited.ok, true);
  if (!edited.ok) {
    return;
  }
  assert.equal(edited.value.userSatisfactionScore, 1);
  assert.equal(edited.value.structureScore, 0.5);
  assertQualityReport(edited.value);

  const direct = evaluateDraft({
    contentText: TOO_LONG,
    contentType: "social_caption",
    keywords: ["tasting"],
    brandTone: "friendly",
    rating: 5,
  });
  assert.deepEqual(edited.value, direct.ok ? direct.value : null);
});

test("a rescore reads the rating from the draft, never from a default", () => {
  const rated = rescoreText(draft(), SOCIAL, "friendly");
  const neutral = rescoreText(draft({ rating: null }), SOCIAL, "friendly");
  assert.equal(rated.ok && neutral.ok, true);
  if (!rated.ok || !neutral.ok) {
    return;
  }
  assert.equal(rated.value.userSatisfactionScore, 1);
  assert.equal(neutral.value.userSatisfactionScore, 0.5);
  assert.ok(rated.value.overallScore > neutral.value.overallScore);
});

test("an edit too short to score comes back as a refusal, not as a zero", () => {
  const edited = rescoreText(draft(), "ok", "friendly");
  assert.equal(edited.ok, false);
  if (!edited.ok) {
    assert.match(edited.error, /too short/);
  }
});

test("the structure parts and the score always agree", () => {
  const samples = [
    { contentType: "blog_outline" as const, text: BLOG },
    { contentType: "social_caption" as const, text: SOCIAL },
    { contentType: "email_newsletter" as const, text: EMAIL },
  ];
  for (const sample of samples) {
    const parts = structureParts(sample.text, sample.contentType);
    const passed = parts.filter((part) => part.passed).length;
    assert.equal(parts.length >= 2, true);
    assert.equal(structureScore(sample.text, sample.contentType), passed / parts.length);
    assert.equal(new Set(parts.map((part) => part.id)).size, parts.length);
  }
});

test("the caption limit is one number, and the boundary is exact", () => {
  const atLimit = `${"a".repeat(SOCIAL_CAPTION_MAX - 5)} book`;
  const overLimit = `${atLimit} now`;
  assert.equal(atLimit.length, SOCIAL_CAPTION_MAX);
  assert.equal(structureScore(atLimit, "social_caption"), 1);
  assert.equal(structureScore(overLimit, "social_caption"), 0.5);
  const parts = structureParts(overLimit, "social_caption");
  assert.deepEqual(
    parts.filter((part) => !part.passed).map((part) => part.id),
    ["character limit"],
  );
});
