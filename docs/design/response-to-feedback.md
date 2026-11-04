# Response to architectural implementation feedback

Received from the course instructor after the demonstration build.
Five recommendations: dynamic prompt management, cost engineering, API flexibility, contextual personalisation, and feedback loops.

This document answers each one against the build as it exists at `db49a97`, not against the proposal.
Each section states what the code does today, the measurement that decides the item, and the decision: build it, build a reduced form, or decline it with a reason.

A recommendation accepted on principle but built at full scope would cost the evaluation experiment its time.
The evaluation experiment is the one deliverable the earlier review named as missing, so the order below protects it.

---

## Summary

| # | Recommendation | Decision | Shape | Effort |
|---|---|---|---|---|
| 1 | Dynamic prompt management | Built, card `F4` | Template table with a version per content type, version stamped on each draft, lint against the scorer's own checks | 1 card |
| 2 | Cost engineering | Build the measurement, decline the shortening | Record `usageMetadata` per draft, show month to date tokens and cost from a rate table | 1 card |
| 3 | API flexibility | Build | `ContentGenerator` port with one Gemini adapter, provider from config | 1 card |
| 4 | Contextual personalisation | Decline this unit | Two profile columns would do it later; an agent layer would not | 0 |
| 5 | Feedback loops | Build first | The evaluation experiment at `docs/design/evaluation.md`, plus a defect fix it depends on | 2 cards |

Order: 5, then 3, then 2, then 1.
Each step needs the evidence the one before it produces.
A cost dashboard is per-provider plumbing before there is a port, and prompt versioning is unmeasurable before there is a metric.
Item 1 landed before items 5 and 2 anyway, because the structure lint runs at request time and does not depend on the experiment.

---

## 1. Dynamic prompt management

**Asked:** move prompts out of the source, store them where they can be versioned and tested without a code change.

**Before.** `web/lib/prompts.ts` held two tables in code: `TONE_GUIDE` for three tones and `FORMAT_RULES` for three content types.
`buildSystemPrompt` assembles a 76 word system prompt from the profile, and `buildUserPrompt` assembles 47 to 60 words by content type.
Six tests in `web/lib/prompts.test.ts` pin that assembly, including the W2.2 acceptance criteria.
Every draft already stores the exact `system_prompt` and `user_prompt` that produced it, in `generated_content`, alongside the model and the temperature.

So the audit trail the recommendation wants already existed per draft.
What did not exist was a way to change a template without editing a TypeScript file.

**Decision: build it, with the tests kept.**

Built as card `F4`, closed with the schema, the resolution and the lint below.

- A `prompt_template` table: `content_type`, `version`, `body`, `is_active`, `created_at`, with a partial unique index allowing one active row per content type.
- `lib/prompts.ts` resolves the highest active row and falls back to the built-in table, so a fresh database and a test run behave identically and a database that lost the table still generates.
- `generated_content.prompt_version` records `builtin:1` or `template:<n>`, so a draft is attributed to the version that produced it and not only to its text.
- `templateProblems` holds the lint: every body has to mention the structures its content type is scored on, which is subject, preview and button for email, a call to action and the character limit for social, and an introduction, headings and a conclusion for blog.

The lint runs in two places.
`web/lib/prompts.test.ts` fails the build when a built-in body drops a structure.
The generate route refuses a stored body that fails the same check, logs it, and uses the built-in body instead, so a template edited in the SQL editor cannot reach the model unvetted.
`lib/evaluate.ts` already scores structure with per-type checks, so the scorer defines what a template has to ask for.
A new template version that quietly drops the subject line is refused for that request, and would otherwise have shown up as a scoring regression weeks later.
Activation stays a SQL change, which means it passes through review.

The shape differs from the plan in two places.
There is no `brand_tone` column, because the tone descriptors are three short strings that nothing scores, and a nullable second key would have bought a dimension with no evidence behind it.
The tone text still reaches each draft, because the whole system prompt is stored with it.
And a stored template is selected as a whole body rather than assembled from parts, so one row per content type is the unit of versioning.

**Declined within item 1:** an administrative dashboard for editing prompts.
The table plus the lint plus review is the versioning.
A second interface to write the same rows is a card that produces no evidence a marker can read.

---

## 2. Cost engineering

**Asked:** shorten prompts to cut token spend, and build dashboards for token usage and cost per user.

**Measured.** The system prompt is 76 words and the user prompt 47 to 60, so a call sends roughly 190 input tokens.
`GEMINI_MAX_OUTPUT_TOKENS` caps the response at 1024.
Input is therefore about 16 percent of a worst case call, and a prompt 30 percent shorter saves under 5 percent of it.

No token or cost data is recorded anywhere today.
`extractGeminiText` in `web/lib/gemini.ts` reads `candidates` and discards `usageMetadata`.
The only spend control in the build is `MONTHLY_LIMIT`, 20 drafts per user per month counted in UTC in `app/api/generate/route.ts`.

**Decision: record usage and show it, decline the shortening.**

The shortening lever is aimed at the wrong term of the sum.
Output is capped at 1024 tokens and the input is 190, so the ratio is set by the cap, not by the prompt.
Two things actually bound spend, and both are already in place: the output cap and the monthly limit, which holds a heavy user to about 24,000 tokens a month.
Trimming the prompt to make the number smaller would be spending a card on a 5 percent change.

What is missing is the ability to state the cost at all, which is what the recommendation is really about.
Add `usage` to the draft row, populated from `usageMetadata` on the response, and a rate table keyed by model with input and output price per million.
The dashboard then shows month to date tokens and cost for the signed in user, computed from the rate row instead of a price hardcoded in a component.
Prices change and models get retired; a constant in the code would be wrong within a term.

Context caching does not apply at this size, because a 190 token prompt sits far below any provider's minimum cacheable length.

---

## 3. API flexibility

**Asked:** store provider configuration dynamically rather than hardcoding a provider.

**Today.** `web/lib/gemini.ts` owns the base URL, the default model, the temperature, the body shape and the response parser.
`app/api/generate/route.ts` imports all of it directly.
There is no interface between the route and the provider.

This recommendation is the one the project has already tested in practice, because the build began against OpenAI and moved to Gemini.
`docs/design/architecture.md` section 3.7 claims the boundary exists and that replacing the provider touches few files.
That claim is currently false, and `docs/sections/05-sequence-diagrams.md` still shows OpenAI in five diagrams.

**Decision: build it.**

A port with one adapter, not a plugin system:

- `lib/generator.ts` defines one function, taking a system prompt and a user prompt, returning `Result<{ text, usage }>`.
- The Gemini logic in `lib/gemini.ts` becomes the first adapter behind it, unchanged in behaviour.
- Provider, model and base URL resolve from configuration, and an unknown provider is an `invariant` failure, because it is a deployment error and not something a request can recover from.
- The route imports the port and nothing else.

The value is not the second adapter. It is that the provider becomes a value the system can report and the docs can be corrected against, which also closes the OpenAI and Gemini contradiction before the second reviewer finds it.
`architecture.md` section 3.7 and the five diagrams need updating in the same change.

---

## 4. Contextual personalisation

**Asked:** deploy backend agents that fetch user context automatically, and inject variables such as location or cultural interests.

**Today.** The profile fetch in the route already is that agent, in the useful sense: it reads the row and injects `business_name`, `industry`, `description`, `target_audience` and `brand_tone` into the system prompt.
`business_profile` has no location column.

**Decision: decline this unit.**

Two cheap versions exist and neither earns a card before the evaluation work is done.

The first is two columns, location and audience notes, plus one line in the system prompt.
That is a real feature and it is small, but it changes prompt content with no way to measure whether the change helped, which is exactly the position item 5 exists to fix.

The second is deriving voice from the user's own published drafts and injecting one or two as style anchors.
The data is already in the table.
It also makes the prompt longer on every call, which is the opposite direction from item 2, so it needs the cost measurement to be judged.

An agent layer with tool calls and a context service is over scoped.
Four developers, one builder, one deployable, and two tables. The route handler fetching a row it already needs is the correct size.

---

## 5. Feedback loops

**Asked:** capture user feedback, analyse failure points, and use that to refine prompts and system context.

**Today.** Three signals exist per draft and none of them are joined:

| Signal | Where | What it means |
|---|---|---|
| `rating` | 1 to 5, set by the user | Explicit judgment |
| `status` | `published` or `discarded` | Implicit judgment, costs the user nothing |
| `analysis` | five metrics plus an overall score | The computed judgment |

Two defects block the loop today.

**The satisfaction metric is inert.** `userSatisfactionScore` carries 0.35 of the weight in `QUALITY_WEIGHTS`, and it is computed at generation time from a `null` rating, so every stored report holds the neutral 0.5.
Both rating write paths update the `rating` column and leave `analysis` alone.
A user rating a draft 5 of 5 does not move the score by one point, while the metric that carries the most weight is the one that never updates.

**Nothing compares human judgment to computed judgment.** That is the evaluation experiment, card G3, and it is the deliverable the earlier review named as missing when it said the proposal lacked a defensible evaluation approach.

**Decision: build it first, in two cards.**

Card one fixes the metric: recompute the report on rating change, in one place, with `assertQualityReport` guarding that the stored overall score still matches its weights.
That is the reason `lib/score.ts` exists, and it is small.

Card two is the experiment, `docs/design/evaluation.md`:

- A labelled sample of drafts across the three content types.
- Human ratings from people outside the build, against the same 1 to 5 scale.
- An agreement statistic: Spearman for the ordinal scores, and a kappa over pass and fail at the 0.6 threshold, since the threshold is what the product acts on.
- A per-metric error analysis naming the weakest metric. The expectation is the tone heuristic, which is a marker-word count and does not read voice.
- One prompt or weight change, made and measured against the sample, so the loop is demonstrated once end to end.

The implicit signal is the cheap half and should be reported with it: drafts discarded inside a day, and drafts published, are labels the users already gave for free.

This is also what makes item 1 mean anything.
A versioning scheme with no metric compares versions by opinion.

---

## Consequences

Three files describe a system that this response changes.

- `docs/design/architecture.md` section 3.7 states the provider boundary exists. Item 3 makes that true, and the section should be updated in the same change.
- `docs/sections/05-sequence-diagrams.md` shows OpenAI in five diagrams while the build calls Gemini. Item 3 resolves the contradiction; the diagrams still need redrawing.
- `docs/plan/build-plan.md` needs four cards: usage and cost, the provider port, prompt templates, and the satisfaction recompute, plus G3 restated with its acceptance lines.

## What this response declines, and why

| Declined | Reason |
|---|---|
| Prompt editing dashboard | The table, the lint and review are the versioning. A second write interface produces nothing measurable. |
| Shortening prompts for cost | Input is 190 tokens against a 1024 token output cap. The saving is under 5 percent of a call. |
| A caching layer | The prompt is far below any provider's minimum cacheable length. |
| An agent layer for personalisation | One row fetch in the handler already does the job. The data is two columns, not a service. |
| Building all five thin | Five shallow items leave the evaluation experiment unbuilt, and that is the assessed gap. |
