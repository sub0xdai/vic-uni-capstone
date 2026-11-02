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
| `/generate` | Pick a content type, enter a topic and keywords, generate, edit, copy, rate |
| `/dashboard` | Draft list with star ratings, publish and discard, the monthly usage and the latest quality score |
| `/preview` | Every component with fake data, no database and no login |
| `/api/generate` | The only server route. Calls Gemini, scores the draft and saves it |

`proxy.ts` guards `/dashboard`, `/onboarding` and `/generate`.
A signed out request goes to `/login`.
A signed in request for `/login` goes to `/dashboard`.

## Checks

```bash
pnpm check    # typecheck, lint, tests
pnpm build    # production build
```

`pnpm check` has to pass before anyone reviews your pull request.

## Database

The schema is `supabase/schema.sql`.
Paste the whole file into the Supabase SQL editor and run it.
It creates the tables, the row level security policies, the grants the roles need, and the unique index that stops one click producing two drafts.

`generated_content.idempotency_key` carries a per-request key from the browser.
The route replays an existing draft when it sees a key it already saved, so a double click or a retry returns the first draft instead of making a second one.

## Layout

```
app/           routes, one folder per page, plus api/generate
components/    the pieces those pages render
lib/           types, parsers, scoring, env, prompts, Gemini client, Supabase clients
supabase/      schema.sql
proxy.ts       the session guard
```

`lib/types.ts`, `lib/assert.ts`, `lib/env.ts`, `lib/score.ts` and `lib/supabase/*` are shared by everyone.
Change them deliberately, not while working on a card.

`lib/evaluate.ts` computes the quality report.
`lib/score.ts` holds the weights and the threshold and checks that a report adds up.
