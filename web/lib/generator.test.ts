import assert from "node:assert/strict";
import test from "node:test";
import { InvariantError } from "./assert.ts";
import { MissingEnvError } from "./env.ts";
import {
  GENERATOR_DEFAULT_MODEL,
  GENERATOR_DEFAULT_PROVIDER,
  createGenerator,
  generatorFromEnv,
} from "./generator.ts";
import { GEMINI_BASE_URL } from "./gemini.ts";

const SETTINGS = {
  provider: GENERATOR_DEFAULT_PROVIDER,
  model: "test-model",
  baseUrl: GEMINI_BASE_URL,
  apiKey: "test-key", // @waiver PII: a fake value in a test
};

function withEnv(values: Record<string, string | undefined>, run: () => void): void {
  const saved: Record<string, string | undefined> = {};
  for (const key of Object.keys(values)) {
    saved[key] = process.env[key];
    if (values[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = values[key];
    }
  }
  try {
    run();
  } finally {
    for (const key of Object.keys(saved)) {
      if (saved[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = saved[key];
      }
    }
  }
}

test("a known provider with its settings builds a generator that reports them", () => {
  const generator = createGenerator(SETTINGS);
  assert.equal(generator.provider, "gemini");
  assert.equal(generator.model, "test-model");
  assert.equal(generator.baseUrl, GEMINI_BASE_URL);
  assert.equal(typeof generator.generate, "function");
});

test("an unknown provider is refused by name instead of falling back", () => {
  assert.throws(
    () => createGenerator({ ...SETTINGS, provider: "openai" }),
    (error: unknown) =>
      error instanceof InvariantError && error.detail.includes("openai"),
  );
});

test("settings with a blank key or model are refused", () => {
  assert.throws(() => createGenerator({ ...SETTINGS, apiKey: "  " })); // @waiver PII: fake
  assert.throws(() => createGenerator({ ...SETTINGS, model: "" }));
  assert.throws(() => createGenerator({ ...SETTINGS, baseUrl: "" }));
});

test("the environment supplies the provider, model and base url in that order", () => {
  withEnv(
    {
      GENERATOR_PROVIDER: undefined,
      GENERATOR_MODEL: undefined,
      GEMINI_MODEL: undefined,
      GENERATOR_BASE_URL: undefined,
      GEMINI_API_KEY: "from-env", // @waiver PII: a fake value in a test
    },
    () => {
      const generator = generatorFromEnv();
      assert.equal(generator.provider, GENERATOR_DEFAULT_PROVIDER);
      assert.equal(generator.model, GENERATOR_DEFAULT_MODEL);
      assert.equal(generator.baseUrl, GEMINI_BASE_URL);
    },
  );
});

test("GENERATOR_MODEL wins over the older GEMINI_MODEL name", () => {
  withEnv(
    {
      GENERATOR_MODEL: "chosen",
      GEMINI_MODEL: "older",
      GEMINI_API_KEY: "from-env", // @waiver PII: a fake value in a test
    },
    () => {
      assert.equal(generatorFromEnv().model, "chosen");
    },
  );
  withEnv(
    {
      GENERATOR_MODEL: undefined,
      GEMINI_MODEL: "older",
      GEMINI_API_KEY: "key", // @waiver PII: a fake value in a test
    },
    () => {
      assert.equal(generatorFromEnv().model, "older");
    },
  );
});

test("a configured provider other than the supported one is refused", () => {
  withEnv(
    {
      GENERATOR_PROVIDER: "anthropic",
      GEMINI_API_KEY: "key", // @waiver PII: a fake value in a test
    },
    () => {
      assert.throws(() => generatorFromEnv(), (error: unknown) => error instanceof InvariantError);
    },
  );
});

test("a missing api key names the variable that is missing", () => {
  withEnv(
    {
      GENERATOR_PROVIDER: undefined,
      GEMINI_API_KEY: undefined, // @waiver PII: asserts the variable is absent
    },
    () => {
      assert.throws(
        () => generatorFromEnv(),
        (error: unknown) =>
          error instanceof MissingEnvError && error.variable === "GEMINI_API_KEY",
      );
    },
  );
});
