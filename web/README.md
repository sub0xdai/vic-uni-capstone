# web

The ContentCraft application: Next.js 16 App Router, React 19, TypeScript and Tailwind 4.

Prerequisites, install and the development command are in the root README, because they are the same for anyone opening the repository.
This file covers what the application needs, how it is put together, and what the database expects.

## Environment

`.env.local` is not committed.
`cp .env.local.example .env.local` and fill it in.

| Variable | Used for | When it is missing |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | login, the profile, the dashboard, the draft pages | the app boots, `/preview` works, and every guarded page redirects to `/login` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the same, and every row read the browser makes | the same |
| `GEMINI_API_KEY` | `/api/generate` | the endpoint answers that the AI service is not set up yet, as a sentence rather than a stack trace |
| `GENERATOR_PROVIDER` | which adapter to build; the only value is `gemini` | defaults to `gemini`; any other value fails naming itself, because a wrong deployment variable has no recovery at request time |
| `GENERATOR_MODEL` | the model the request names | defaults to `gemini-3.5-flash-lite`; `GEMINI_MODEL` is still read as the older alias |
| `GENERATOR_BASE_URL` | the endpoint | defaults to Google's |
| `SUPABASE_SERVICE_ROLE_KEY` | administrative work only, such as deleting test accounts | nothing in the app reads it |

The two public variables have to be written out in full where the browser reads them, because the build only inlines a public value it can see literally.
Reading one by name returns nothing in the browser and works on the server, which is a bug that already cost a day.

## Routes

| Route | What it does |
|---|---|
| `/` | Sends you to `/dashboard` when signed in, otherwise to `/login` |
| `/login` | Sign in, or create an account |
| `/onboarding` | Create or edit the business profile |
| `/generate` | Pick a content type, enter a topic and keywords, generate, edit, copy, rate. Reuse a saved draft to start with its inputs |
| `/dashboard` | Draft list with a status filter and counts, star ratings, mark ready and discard, the monthly usage and the latest quality score |
| `/draft/[id]` | One saved draft: a format preview, the text with its live budget, its quality report with the reason for each failed check, the prompt that produced it, mark ready, discard, edit and rate |
| `/preview` | Every component with fake data, no database and no login |
| `/api/generate` | The only server route. Generates through the provider port, scores the draft and saves it |

`proxy.ts` guards `/dashboard`, `/onboarding`, `/generate` and `/draft`.
A signed out request goes to `/login`, and a signed in request for `/login` goes to `/dashboard`.

## Data

`supabase/schema.sql` creates the whole database, so it is for a fresh project.

An existing project takes the dated files instead, in this order, each pasted into the SQL editor:

1. `2026-11-03-usage-and-rates.sql` adds the `usage` column and the `model_rate` table.
2. `2026-11-04-model-rate-policy.sql` adds the read policy `model_rate` needs.
3. `2026-11-05-prompt-template.sql` adds the `prompt_template` table and the `prompt_version` column.
4. `2026-11-05-generation-lock.sql` adds `generation_lock`.

Without the prompt template migration, a generation cannot save its draft.
Without the lock migration, every generation request answers that it could not start.

Every table has row level security, and the grants are named table by table with no default privileges.
A new table therefore starts with no client access at all, and has to state its own grant next to its own policies.
That is deliberate: a blanket grant once covered the price table, which meant any signed-in user could rewrite what they were charged until security happened to be switched on by hand.

**One generation per account.**
A request takes its own row in `generation_lock` before calling the model and releases it in a `finally`, so a second request while one is running is answered with 429 instead of a second billable call.
A row older than ninety seconds is treated as abandoned and cleared, so a crashed request cannot lock its owner out.

**Prompts are data with a version.**
The built-in bodies are in `lib/prompts.ts`.
`prompt_template` overrides them: insert a row with a higher `version` and `is_active = true`, and the route uses it for every draft of that content type until a newer one is activated.
Only one row per content type can be active, clients can read the table and not write it, and a body that stops naming a structure the scorer checks is refused and logged, with the built-in body used instead.
Every draft records which one produced it as `prompt_version`, either `builtin:1` or `template:<n>`.

**Usage and price.**
`generated_content.usage` holds the provider's own token count for the draft, and `model_rate` holds a price per million tokens per model, so the cost on the dashboard is data rather than a constant.
The seeded rate is a placeholder and should be replaced with the provider's published price before any cost figure is quoted.

**A double click buys one draft.**
`generated_content.idempotency_key` carries a per-request key from the browser, and the route replays an existing draft when it sees a key it has already saved.

A Free plan Supabase project pauses after seven days without activity, and waking it is a dashboard action.
Wake it before a demonstration.

The isolation rules were verified against the live project, and the run is recorded in
[docs/plan/tenancy-check.md](../docs/plan/tenancy-check.md).
`tools/tenancy` reproduces it in one command and exits non-zero if a policy has stopped holding.

## Checks

```bash
pnpm check    # typecheck, lint, tests
pnpm build    # production build
```

`pnpm check` has to pass before anyone reviews a pull request.
The Go tools are checked separately, with `go test ./...` in each tool's folder.

## Layout

```
app/           routes, one folder per page, plus api/generate
components/    the pieces those pages render
lib/           types, parsers, scoring, env, prompts, the generator port, its Gemini adapter, Supabase clients
supabase/      schema.sql and the dated migrations
proxy.ts       the session guard
```

`lib/types.ts`, `lib/assert.ts`, `lib/env.ts`, `lib/score.ts` and `lib/supabase/*` are shared by everyone.
Change them deliberately, not while working on a card.

- `lib/evaluate.ts` computes the quality report, and `applyRating` recomputes it when a rating is saved.
- `lib/score.ts` holds the weights and the threshold, and refuses a report that does not add up.
- `lib/usage.ts` sums token usage for the month and prices it from `model_rate`.
- `lib/generator.ts` is the port every caller uses, and `lib/gemini.ts` is the only module that knows what a Gemini request and response look like.

## Scoring

Five metrics, weighted: readability 10 percent, tone 20, keyword coverage 20, structure 15, and the owner's satisfaction 35.
A draft below 0.6 needs work.

Readability comes from a reading-ease formula, keywords from coverage of what the owner asked for, structure from per-type checks, and satisfaction from the star rating, which scores neutral until the owner rates it.
Tone is a word-marker heuristic matched against the brand voice, and it is a heuristic rather than a judgment: the correlation between the score and a human reader is what the evaluation experiment exists to measure.
