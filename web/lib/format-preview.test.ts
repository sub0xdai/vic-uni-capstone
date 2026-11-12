import assert from "node:assert/strict";
import test from "node:test";
import { previewOf } from "./format-preview.ts";
import { ctaMatch, structureScore } from "./evaluate.ts";
import { SOCIAL_CAPTION_MAX } from "./types.ts";

const EMAIL = `Subject: A quieter Tuesday, solved
Preview: Three ways to fill the afternoon
Hi there, here are three ways to fill a slow afternoon.
Button: Book a tasting flight`;

const EMAIL_NO_BUTTON = `Subject: Winter hours
Preview: We open at seven
Our winter hours start on Monday.
See you at the counter.`;

const NO_LABELS = `Hi there, here is the news.
Nothing is labelled in this one.`;

const OUTLINE = `Introduction
We help cafe owners fill quiet afternoons.
Three Ways To Fill A Quiet Tuesday
1. Run a tasting flight for regulars.
2. Pair a pastry with every coffee sold after two.
3. Invite the local book club to host its meeting here.
Conclusion
Book a tasting flight this week and see the difference.`;

const SHAPELESS = `A wall of text with no sections at all.
It just keeps going.`;

test("a labelled email becomes four parts and a body", () => {
  const view = previewOf("email_newsletter", EMAIL);
  assert.equal(view.kind, "email");
  if (view.kind !== "email") {
    return;
  }
  assert.equal(view.subject, "A quieter Tuesday, solved");
  assert.equal(view.preview, "Three ways to fill the afternoon");
  assert.equal(view.button, "Book a tasting flight");
  assert.equal(view.body, "Hi there, here are three ways to fill a slow afternoon.");
  assert.doesNotMatch(view.body, /Subject|Preview|Button/);
});

test("an email missing a label keeps the rest and reports the gap", () => {
  const view = previewOf("email_newsletter", EMAIL_NO_BUTTON);
  assert.equal(view.kind, "email");
  if (view.kind !== "email") {
    return;
  }
  assert.equal(view.subject, "Winter hours");
  assert.equal(view.preview, "We open at seven");
  assert.equal(view.button, null);
  assert.match(view.body, /winter hours start on Monday/);
});

test("an email with no labels at all falls back to plain text", () => {
  const view = previewOf("email_newsletter", NO_LABELS);
  assert.equal(view.kind, "plain");
  if (view.kind === "plain") {
    assert.equal(view.text, NO_LABELS);
  }
});

test("a label with nothing after it takes the next line", () => {
  const view = previewOf("email_newsletter", "Subject:\nWinter hours\nPreview: Seven\nHi there.");
  assert.equal(view.kind, "email");
  if (view.kind !== "email") {
    return;
  }
  assert.equal(view.subject, "Winter hours");
});

test("a caption reports its length against the limit", () => {
  const under = previewOf("social_caption", "Book a tasting flight this week.");
  assert.equal(under.kind, "caption");
  if (under.kind === "caption") {
    assert.equal(under.length, 32);
    assert.equal(under.limit, SOCIAL_CAPTION_MAX);
    assert.equal(under.overBudget, false);
  }

  const over = previewOf("social_caption", "a".repeat(SOCIAL_CAPTION_MAX + 1));
  assert.equal(over.kind, "caption");
  if (over.kind === "caption") {
    assert.equal(over.overBudget, true);
  }
});

test("a caption preview names the call to action it found", () => {
  const view = previewOf("social_caption", "Quiet Tuesday? Book a tasting flight this week.");
  assert.equal(view.kind, "caption");
  if (view.kind !== "caption") {
    return;
  }
  assert.equal(ctaMatch(view.text), "Book");
  assert.equal(ctaMatch("A quiet Tuesday on the shelf."), null);
});

test("an outline separates its introduction, headings and conclusion", () => {
  const view = previewOf("blog_outline", OUTLINE);
  assert.equal(view.kind, "outline");
  if (view.kind !== "outline") {
    return;
  }
  assert.equal(view.introduction, "We help cafe owners fill quiet afternoons.");
  assert.deepEqual(view.headings, [
    "1. Run a tasting flight for regulars.",
    "2. Pair a pastry with every coffee sold after two.",
    "3. Invite the local book club to host its meeting here.",
  ]);
  assert.equal(view.conclusion, "Book a tasting flight this week and see the difference.");
  assert.equal(structureScore(OUTLINE, "blog_outline"), 1);
});

test("a draft with no recognisable shape falls back to plain text", () => {
  const view = previewOf("blog_outline", SHAPELESS);
  assert.equal(view.kind, "plain");
});

test("an empty draft has nothing to preview", () => {
  for (const contentType of ["social_caption", "email_newsletter", "blog_outline"] as const) {
    assert.equal(previewOf(contentType, "   ").kind, "plain");
  }
});
