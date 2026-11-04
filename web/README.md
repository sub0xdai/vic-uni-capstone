# web

The ContentCraft application.

## Running it

You need Node 20.9 or newer and pnpm.

```bash
pnpm install
cp .env.local.example .env.local
pnpm dev
```

`/preview` works with an empty `.env.local`.
The remaining routes need a Supabase project and a Gemini key, described in the root README.

## Routes

| Route | What it does |
|---|---|
| `/` | Sends you to `/dashboard` when signed in, otherwise to `/login` |
| `/login` | Sign in, or create an account |
| `/onboarding` | Create or edit the business profile |
| `/generate` | Pick a content type, enter a topic and keywords, generate, edit, copy, rate. Reuse a saved draft to start with its inputs |
| `/dashboard` | Draft list with a status filter and counts, star ratings, mark ready and discard, the monthly usage and the latest quality score |
| `/draft/[id]` | One saved draft: the text with its live budget, its quality report, mark ready, discard, edit and rate |
| `/preview` | Every component with fake data, no database and no login |
| `/api/generate` | The only server route. Generates through the provider port, scores the draft and saves it |

`proxy.ts` guards `/dashboard`, `/onboarding`, `/generate` and `/draft`.
A signed out request goes to `/login`.
A signed in request for `/login` goes to `/dashboard`.

## Checks

```bash
pnpm check    # typecheck, lint, tests
pnpm build    # production build
```

`pnpm check` has to pass before anyone reviews your pull request.

## Database

The schema is `supabase/schema.sql`, for a fresh project.
An existing project takes `supabase/2026-11-03-usage-and-rates.sql`, which adds the `usage` column and the `model_rate` table, then `supabase/2026-11-04-model-rate-policy.sql`, then `supabase/2026-11-05-prompt-template.sql`, which adds the `prompt_template` table and the `prompt_version` column.
Paste each into the SQL editor and run it in that order.
Without the last one, generation cannot save a draft.

The built-in prompt bodies are in `web/lib/prompts.ts`.
`prompt_template` overrides them: insert a row with a higher `version` and `is_active = true`, and the route uses it for every draft of that content type until a newer one is activated.
Only one row per content type can be active, and clients can read the table but not write it, so a prompt changes through the SQL editor and review rather than at runtime.
A body that stops naming a structure the scorer checks is refused and the built-in body is used instead.
Every draft records which one it used as `prompt_version`, `builtin:1` or `template:<n>`.

`generated_content.usage` holds the provider's own token count for the draft.
`model_rate` holds a price per million tokens for each model, so the dashboard's cost figure is data rather than a constant copied into the code.
The seeded rate is a placeholder to replace with the provider's published price.

`generated_content.idempotency_key` carries a per-request key from the browser.
The route replays an existing draft when it sees a key it already saved, so a double click or a retry returns the first draft instead of making a second one.

The isolation check, and why it has to be a query rather than a look at the dashboard, is in the root README.

## Layout

```
app/           routes, one folder per page, plus api/generate
components/    the pieces those pages render
lib/           types, parsers, scoring, env, prompts, the generator port, its Gemini adapter, Supabase clients
supabase/      schema.sql
proxy.ts       the session guard
```

`lib/types.ts`, `lib/assert.ts`, `lib/env.ts`, `lib/score.ts` and `lib/supabase/*` are shared by everyone.
Change them deliberately, not while working on a card.

`lib/evaluate.ts` computes the quality report, and `applyRating` recomputes it when a rating is saved.
`lib/score.ts` holds the weights and the threshold and checks that a report adds up.
`lib/usage.ts` sums token usage for the month and prices it from the `model_rate` table.
`lib/generator.ts` is the port every caller uses for generation, and `lib/gemini.ts` is the only module that knows what Gemini's request and response look like.
