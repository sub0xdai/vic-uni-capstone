import test from "node:test";
import assert from "node:assert/strict";
import {
  BUILTIN_PROMPT_VERSION,
  FORMAT_RULES,
  STRUCTURE_HINTS,
  buildSystemPrompt,
  buildUserPrompt,
  parsePromptTemplate,
  promptVersionLabel,
  resolveTemplate,
  templateProblems,
} from "./prompts.ts";
import { CONTENT_TYPES, type BusinessProfile } from "./types.ts";

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

function row(contentType: string, version: number, body: string, isActive = true) {
  return { content_type: contentType, version, body, is_active: isActive };
}

test("every built-in template asks for what the scorer checks", () => {
  for (const contentType of CONTENT_TYPES) {
    const built = { contentType, version: BUILTIN_PROMPT_VERSION, body: FORMAT_RULES[contentType] };
    assert.deepEqual(templateProblems(built), [], `${contentType} lost a scored structure`);
  }
});

test("the structure lint fails on a template that drops a scored structure", () => {
  const body = "Write an email.";
  const broken = { contentType: "email_newsletter" as const, version: 2, body };
  assert.deepEqual(templateProblems(broken), STRUCTURE_HINTS.email_newsletter);
});

test("an active stored template replaces the built-in body", () => {
  const stored = row("social_caption", 2, FORMAT_RULES.social_caption);
  const template = resolveTemplate([stored], "social_caption");
  assert.notEqual(template, null);
  if (template === null) {
    return;
  }
  assert.equal(promptVersionLabel(template), "template:2");
  const user = buildUserPrompt(
    { contentType: "social_caption", topic: "Launch", keywords: [], profile: PROFILE },
    template,
  );
  assert.equal(user.ok, true);
  if (user.ok) {
    assert.ok(user.value.startsWith(template.body));
    assert.match(user.value, /call to action/);
  }
});

test("the highest active version wins and inactive rows are ignored", () => {
  const rows = [
    row("blog_outline", 1, FORMAT_RULES.blog_outline),
    row("blog_outline", 3, FORMAT_RULES.blog_outline),
    row("blog_outline", 9, FORMAT_RULES.blog_outline, false),
    row("social_caption", 5, FORMAT_RULES.social_caption),
  ];
  assert.equal(resolveTemplate(rows, "blog_outline")?.version, 3);
  assert.equal(resolveTemplate(rows, "email_newsletter"), null);
});

test("with no stored template the draft is stamped builtin", () => {
  assert.equal(promptVersionLabel(null), `builtin:${BUILTIN_PROMPT_VERSION}`);
});

test("a stored row with no body or version is refused", () => {
  assert.equal(parsePromptTemplate(row("blog_outline", 1, "  ")).ok, false);
  assert.equal(parsePromptTemplate({ content_type: "blog_outline", body: "x" }).ok, false);
  assert.equal(parsePromptTemplate({ content_type: "advert", version: 1, body: "x" }).ok, false);
  assert.equal(parsePromptTemplate(row("blog_outline", 1, "  ", false)).ok, false);
});