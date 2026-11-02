import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateDraft,
  keywordCoverage,
  readabilityScore,
  satisfactionFrom,
  structureScore,
  toneAlignment,
} from "./evaluate.ts";
import { weightedScore } from "./score.ts";
import { QUALITY_METRICS, QUALITY_THRESHOLD } from "./types.ts";

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
