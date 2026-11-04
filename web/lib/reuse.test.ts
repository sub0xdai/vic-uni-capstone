import assert from "node:assert/strict";
import test from "node:test";
import { requestFromSearch, reuseHref } from "./reuse.ts";
import type { Draft } from "./types.ts";

const DRAFT: Draft = {
  id: "d1",
  userId: "u1",
  contentType: "email_newsletter",
  topic: "October roast club",
  keywords: ["single origin", "roast club"],
  contentText: "text",
  rating: 4,
  status: "published",
  statusChangedAt: null,
  analysis: null,
  parameters: null,
  usage: null,
  createdAt: "2026-11-05T09:00:00.000Z",
};

test("a reused draft comes back with the same request the generator sends", () => {
  const href = reuseHref(DRAFT);
  const parsed = requestFromSearch(href.slice(href.indexOf("?")));
  assert.deepEqual(parsed, {
    contentType: "email_newsletter",
    topic: "October roast club",
    keywords: ["single origin", "roast club"],
  });
});

test("a topic with punctuation and a keyword with a comma survive the round trip", () => {
  const draft: Draft = {
    ...DRAFT,
    topic: "Coffee, cake & community: a Friday thing?",
    keywords: ["cake, coffee", "50% off"],
  };
  const href = reuseHref(draft);
  const parsed = requestFromSearch(href.slice(href.indexOf("?")));
  assert.equal(parsed?.topic, draft.topic);
  assert.deepEqual(parsed?.keywords, draft.keywords);
});

test("an unfinished or unknown link is refused instead of prefilled", () => {
  assert.equal(requestFromSearch(""), null);
  assert.equal(requestFromSearch("?type=tweet&topic=Launch"), null);
  assert.equal(requestFromSearch("?type=blog_outline"), null);
  assert.equal(requestFromSearch("?type=blog_outline&topic=%20%20"), null);
});

test("blank keywords are dropped and the rest are trimmed", () => {
  const parsed = requestFromSearch(
    "?type=social_caption&topic=Launch&keyword=%20&keyword=coffee%20",
  );
  assert.deepEqual(parsed, {
    contentType: "social_caption",
    topic: "Launch",
    keywords: ["coffee"],
  });
});
