import assert from "node:assert/strict";
import test from "node:test";
import { CONTENT_TYPES, generateCopy, sampleCopy, type LandingBrief } from "./landing.ts";

const BRIEF: LandingBrief = {
  businessName: "Sunrise Cafe",
  businessType: "Cafe / Restaurant",
  audience: "local coffee lovers",
  message: "Coffee and a pastry for eight dollars, every Tuesday.",
};

test("every content type has a sample and a generated draft", () => {
  for (const type of CONTENT_TYPES) {
    assert.ok(sampleCopy(type).trim().length > 0, `${type} has no sample`);
    assert.ok(generateCopy(type, BRIEF).trim().length > 0, `${type} generated nothing`);
  }
});

test("an unknown content type is refused", () => {
  assert.throws(() => sampleCopy("Podcast" as never));
  assert.throws(() => generateCopy("Podcast" as never, BRIEF));
});

test("a generated draft carries the business name and the audience", () => {
  for (const type of CONTENT_TYPES) {
    const text = generateCopy(type, BRIEF);
    assert.ok(text.includes("Sunrise Cafe"), `${type} lost the business name`);
    assert.ok(text.includes("local coffee lovers"), `${type} lost the audience`);
  }
});

test("the message reaches the draft that shows it", () => {
  assert.ok(generateCopy("Social Media Post", BRIEF).includes("eight dollars"));
  assert.ok(generateCopy("Email Newsletter", BRIEF).includes("eight dollars"));
  assert.ok(generateCopy("Blog Outline", BRIEF).includes("eight dollars"));
  assert.ok(generateCopy("Image Prompt", BRIEF).includes("eight dollars"));
});

test("blank fields fall back instead of printing gaps", () => {
  const text = generateCopy("Email Newsletter", {
    businessName: "   ",
    businessType: "",
    audience: "",
    message: "",
  });

  assert.ok(text.includes("Your business"));
  assert.ok(text.includes("your customers"));
  assert.ok(!text.includes("   "));
});

test("a name with no letters still yields a usable tag", () => {
  const text = generateCopy("Social Media Post", { ...BRIEF, businessName: "!!!" });
  assert.ok(text.includes("#YourBusiness"));
});

test("the four types produce four different drafts", () => {
  const texts = CONTENT_TYPES.map((type) => generateCopy(type, BRIEF));
  assert.equal(new Set(texts).size, CONTENT_TYPES.length);
});
