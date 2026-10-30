import test from "node:test";
import assert from "node:assert/strict";
import { buildSystemPrompt, buildUserPrompt } from "./prompts.ts";
import type { BusinessProfile } from "./types.ts";

const PROFILE: BusinessProfile = {
  id: "p1",
  userId: "u1",
  businessName: "Footscray Coffee Roasters",
  industry: "Hospitality",
  description: "Small batch coffee roaster.",
  targetAudience: "Local coffee drinkers.",
  brandTone: "friendly",
};

test("W2.2 acceptance", () => {
  const system = buildSystemPrompt(PROFILE);
  assert.equal(system.ok, true);

  const user = buildUserPrompt({
    contentType: "social_caption",
    topic: "Single origin launch",
    keywords: ["single origin"],
    profile: PROFILE,
  });
  assert.equal(user.ok, true);
  assert.match(
    JSON.stringify(user),
    /280|character|call to action/i,
  );
});

test("the system prompt carries the business details and tone", () => {
  const system = buildSystemPrompt(PROFILE);
  assert.equal(system.ok, true);
  if (system.ok) {
    assert.match(system.value, /Footscray Coffee Roasters/);
    assert.match(system.value, /Friendly/);
    assert.match(system.value, /Local coffee drinkers/);
  }
});

test("every content type gets its own instructions", () => {
  const social = buildUserPrompt({
    contentType: "social_caption",
    topic: "Launch",
    keywords: [],
    profile: PROFILE,
  });
  const email = buildUserPrompt({
    contentType: "email_newsletter",
    topic: "Launch",
    keywords: [],
    profile: PROFILE,
  });
  const blog = buildUserPrompt({
    contentType: "blog_outline",
    topic: "Launch",
    keywords: [],
    profile: PROFILE,
  });
  assert.equal(social.ok && email.ok && blog.ok, true);
  if (social.ok && email.ok && blog.ok) {
    assert.match(social.value, /280 characters/);
    assert.match(social.value, /call to action/);
    assert.match(email.value, /Subject:/);
    assert.match(email.value, /Preview:/);
    assert.match(email.value, /Button:/);
    assert.match(blog.value, /introduction/);
    assert.match(blog.value, /conclusion/);
  }
});

test("keywords are included and blanks are dropped", () => {
  const user = buildUserPrompt({
    contentType: "social_caption",
    topic: "Launch",
    keywords: ["single origin", "  ", "Ethiopia"],
    profile: PROFILE,
  });
  assert.equal(user.ok, true);
  if (user.ok) {
    assert.match(user.value, /single origin, Ethiopia/);
  }
});

test("an empty topic is refused", () => {
  const user = buildUserPrompt({
    contentType: "social_caption",
    topic: "   ",
    keywords: [],
    profile: PROFILE,
  });
  assert.equal(user.ok, false);
});

test("an incomplete profile is refused", () => {
  const system = buildSystemPrompt({ ...PROFILE, businessName: " " });
  assert.equal(system.ok, false);
});