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
- `GEMINI_API_KEY` for the generation endpoint, which defaults to `gemini-3.5-flash-lite` and takes `GEMINI_MODEL` to change that.

Without them the app still boots and `/preview` still works.
The generation endpoint answers with a plain sentence instead of a stack trace.

## Checks

```bash
cd web
pnpm check    # typecheck, lint, tests
pnpm build    # production build
```

`pnpm check` has to pass before anyone reviews your pull request.

There is no CI. The check runs on your machine, so run it before you push.
A pull request that does not pass it will not be merged.

## Database

The schema is `web/supabase/schema.sql`.
Paste the whole file into the Supabase SQL editor and run it.

It creates two tables, enables row level security, adds the policies that keep one tenant from reading another tenant's rows, and grants the roles Supabase expects.
Without the grants a fresh project answers `permission denied` on the first query.

To confirm the tenancy rules hold, create two users, give each one a business profile, then read profiles while signed in as the first user.
You should get one row back.
Two rows means the row-level security policies are wrong.

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
- Generation through Gemini, limited to 20 drafts a month counted in UTC.
- Draft editing, copy, star ratings, delete, publish and discard, and a dashboard with the monthly usage.
- A quality report per draft, stored with it and shown on the dashboard.

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
- `docs/plan/working-agreements.md` covers how to work on a card without breaking anyone else
- `docs/important_info.md` is the unit brief

## Status

The proposal and design are written and marked.

The application is built and merged: accounts, the brand profile, generation for all three content types, the editor, and the dashboard.

Still open, and tracked in `docs/plan/build-plan.md`:

- A live Supabase project with the schema applied, and the two-user isolation check run against it. Nothing has been exercised end to end without it.
- A deployment. There is no public URL yet.
- An API key for generation on the deployed build.
- The evaluation experiment: human ratings against the computed scores, and an agreement statistic.
- A load test against the non functional requirements.
