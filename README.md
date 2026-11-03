# vic-uni-capstone

Capstone project for NIT3003 at Victoria University.
The project is ContentCraft, a web app that writes marketing copy for small businesses from a brand profile the owner fills in.

The unit runs in two parts. NIT3003 covers the proposal and the design.
The build has to be mostly finished before the second unit starts, because that unit opens with a demonstration and marks the progress diary kept in between.
That demonstration has passed. The remaining work is depth, not scaffolding.

## Layout

```
docs/          proposal, design and the plan
  sections/    14 markdown files, one per numbered section
  design/      architecture decisions and the reasoning behind them
  plan/        build plan, board cards, review notes, working agreements
  diary/       the assessed progress diary, one folder per person
  build/       pulls the markdown back out of a docx
  assets/      images the proposal references
web/           the application
.githooks/     the pre-commit scan
scrub.py       what the scan runs
pyproject.toml Python dependencies for the scan
Makefile       proposal build
```

## Running the app

You need Node 20.9 or newer and pnpm.

```bash
cd web
pnpm install
cp .env.local.example .env.local
pnpm dev
```

`http://localhost:3000/preview` renders every component with fake data.
That page needs no database, no API keys and no login, so most component work happens there.
It is also the workbench: if a change is not visible on `/preview`, nobody can review it.

The other routes need a real backend:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for login, the profile and the dashboard.
- `GEMINI_API_KEY` for generation.
- `GENERATOR_PROVIDER`, `GENERATOR_MODEL` and `GENERATOR_BASE_URL` to choose the provider, its model and its endpoint. The defaults are `gemini`, `gemini-3.5-flash-lite` and Google's endpoint. `GEMINI_MODEL` is still read as an older alias.

Without them the app still boots and `/preview` still works.
The generation endpoint answers with a plain sentence instead of a stack trace.

Ask the repository owner for the values.
`web/.env.local` is not committed.

## Checks

```bash
cd web
pnpm check    # typecheck, lint, tests
pnpm build    # production build
```

`pnpm check` has to pass before anyone reviews your pull request.

There is no CI. The check runs on your machine, so run it before you push.
A pull request that does not pass it will not be merged.

## PII and secret scan

`.githooks/pre-commit` runs `scrub.py` over staged `.rs`, `.ts`, `.tsx`, `.js` and `.jsx` files and refuses the commit when it finds an email, a phone number, a card number, an IBAN, an SSN, a passport number, a connection string or an API key assignment.
It prints `file:line` and never rewrites a staged file.

It is not armed automatically, because `core.hooksPath` is a local setting.

```bash
uv sync                                  # Python dependencies for the scan
git config core.hooksPath .githooks      # arm it
bash .githooks/pre-commit                # see what it would say
```

The scan needs `./.venv`. Without it the hook prints two lines and exits 0, so a clone that has never run `uv sync` commits without a scan.
A false positive takes `@waiver PII: <reason>` on that line.
The canonical `api_key` pattern matches any field named `apiKey`, so code that configures a key carries a handful of waivers.

Rewriting in place is `scrub.py --fix`, which a human runs and reviews.

## Database

The schema is `web/supabase/schema.sql`.
Paste the whole file into the Supabase SQL editor and run it.

It creates three tables, enables row level security on all of them, adds the policies that keep one tenant from reading another tenant's rows, and grants the roles Supabase expects.
Without the grants a fresh project answers `permission denied` on the first query.

Grants are named table by table, and there are no `alter default privileges` rules.
A new table therefore starts with no client access at all, and has to state its own grant next to its own policies.
The previous blanket `grant all on all tables ... to authenticated` covered `model_rate` too, so any signed-in user could rewrite prices until row level security happened to be switched on by hand.

A project exists with this schema applied, including the `idempotency_key` column and its unique index.
The credentials are in `web/.env.local`, which is not committed.
Supabase pauses a Free plan project after 7 days without activity, and waking it is a manual dashboard action, so check it answers before a demonstration.

### Applying a change to an existing project

`schema.sql` creates the whole database, so it is for a fresh project.
An existing one takes the dated file instead, run the same way.

`web/supabase/2026-11-03-usage-and-rates.sql` adds the `usage` column and the `model_rate` table.
Until it runs, generation fails to save, because the route writes `usage` on every draft.

Prices are data, not code, so the dashboard reads them from `model_rate` rather than a constant.
The seeded rate for `gemini-3.5-flash-lite` is a placeholder: replace it with the provider's published price before quoting a cost figure anywhere.

```sql
update model_rate set input_per_million = 0.10, output_per_million = 0.40 where model = 'gemini-3.5-flash-lite';
```

`model_rate` is the one table every signed-in user reads and nobody writes, so its policy is the opposite of the tenant tables: a `for select to anon, authenticated using (true)` policy, and no write grant.
Row level security is enabled there and was, on the live project, enabled without a policy - which reads as an empty result rather than an error.
The dashboard turned that into a silently missing spend figure.
`web/supabase/2026-11-04-model-rate-policy.sql` adds the policy to a project that already has the table.

### The isolation check

The tenancy rule was verified against the live project, and the run is in `docs/plan/tenancy-check.md`.
The check is two accounts, a profile each, then a read as the first user that expects exactly one row.

Do not judge it from the app.
Every page adds its own `.eq("user_id", ...)`, so a working filter and a working policy look identical in the browser and only the policy survives an application bug.
Query without a filter, signed in as user A, and count the rows.

```bash
PROJECT=https://<project-ref>.supabase.co
ANON=<anon key>

TOKEN=$(curl -s "$PROJECT/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON" -H "content-type: application/json" \
  -d '{"email":"a@example.com","password":"<password>"}' | jq -r .access_token)

curl -s "$PROJECT/rest/v1/business_profile?select=user_id,business_name" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" | jq
```

One row means the policies hold.
Two rows, or a row belonging to the other account, means the tenancy model is wrong and every claim that rests on it needs revisiting.

## How changes land

`master` is protected. Direct pushes are rejected.

1. Branch off the latest `master`, named after the card, such as `W2.4-profile-route`.
2. One card per branch. Touch only the files your card names.
3. Run `pnpm check` and open a pull request.
4. Someone else approves it, then it is squash merged, so history reads as one card per commit.

The repository owner keeps an admin bypass, so their own cards merge without waiting.
Everyone else needs one approval.

## What the app does today

- Sign up, log in, log out, with the session guarded by `web/proxy.ts`.
- A business profile: name, industry, description, audience and brand tone.
- Three content types: blog outline, social caption, email newsletter.
- Generation through Gemini, limited to 20 drafts a month counted in UTC, behind a provider port so the vendor is configuration rather than an import.
- Draft editing, copy, star ratings, delete, publish and discard, and a dashboard with the monthly usage.
- A quality report per draft, stored with it and shown on the dashboard.
- The report is recomputed when a rating is saved, so the metric that carries 35 percent of the weight is no longer frozen at its unrated value.
- Token usage per draft, from the provider's own count, and an estimated cost for the month on the dashboard.

The quality report is computed locally in `web/lib/evaluate.ts`.
Readability comes from a reading-ease formula, keywords from coverage, structure from per-type checks, tone from a word-marker heuristic, and satisfaction from the star rating.
`web/lib/score.ts` holds the weights and the 0.6 threshold, and rejects a report whose overall score does not match its metrics.
The tone metric is a heuristic, not a judgment about voice. Replacing it is the open evaluation work.

## Building the proposal

```bash
make docx
```

This writes `docs/dist/project_proposal_complete.docx`.
Sources are the markdown files in `docs/sections/`, concatenated in filename order.
Word styling comes from the original submitted docx, which pandoc uses as a reference document, so the output keeps the format that was marked.

Edit the markdown.
The docx is a build output and rebuilding overwrites it.

`make extract` goes the other way and rebuilds the markdown from a docx.
You only need it if someone edits the Word file directly.

## Start here

- `docs/plan/build-plan.md` covers who is doing what, what counts as done, and the card briefs
- `docs/design/architecture.md` covers the design decisions and the ones that were rejected
- `docs/design/response-to-feedback.md` answers the instructor's five recommendations, with the measurement that decides each one
- `docs/plan/working-agreements.md` covers how to work on a card without breaking anyone else
- `docs/important_info.md` is the unit brief

## Status

The proposal and design are written and marked.

The application is built and merged: accounts, the brand profile, generation for all three content types, the editor, the dashboard, the quality score, and the provider port.

The database exists with the schema applied, and the tenancy policies were verified on 3 November: two accounts, an unfiltered read as each returning one row, nothing without a token, a cross-tenant insert refused with 403, a cross-tenant update changing nothing, and one account's draft invisible to the other.
`docs/plan/tenancy-check.md` records the checks and what they did not cover.

One generation and one rating have since run through the browser: a blog outline generated, saved, and rated, with the overall score moving when the rating was set.
That exercises `/api/generate`, the provider port, the RLS write and the score recompute together, on the real project.

Still open, and tracked in `docs/plan/build-plan.md`:

- A deployment. There is no public URL yet.
- An API key for generation on the deployed build.
- The evaluation experiment: human ratings against the computed scores, and an agreement statistic. The code no longer blocks it, since a rating now moves the score.
- The remaining instructor cards: prompt templates as data, and the personalisation work the response document declines for this unit.
- A load test against the non functional requirements.
