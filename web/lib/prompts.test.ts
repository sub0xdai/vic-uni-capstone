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

test("W2.2 acceptance (unskip when prompts are real)", { skip: true }, () => {
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
