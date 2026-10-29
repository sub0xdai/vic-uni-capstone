# vic-uni-capstone

Capstone project for NIT3003 at Victoria University.
The project is ContentCraft, a web app that writes marketing copy for small businesses from a brand profile the owner fills in.

The unit runs in two parts. NIT3003 covers the proposal and the design.
The build has to be mostly finished before the second unit starts, because that unit opens with a demonstration and marks the progress diary kept in between.

## Layout

```
docs/          proposal and design
  sections/    14 markdown files, one per numbered section
  design/      architecture decisions and the reasoning behind them
  plan/        task breakdown, owners, acceptance criteria, working agreements
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

The other routes need `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
`OPENAI_API_KEY` is only read by the generation endpoint.

### Checks

```bash
cd web
pnpm check    # typecheck, lint, tests
pnpm build    # production build
```

`pnpm check` has to pass before anyone reviews your pull request.

### Database

The schema is `web/supabase/schema.sql`.
Paste the whole file into the Supabase SQL editor and run it.

To confirm the tenancy rules hold, create two users, give each one a business profile, then read profiles while signed in as the first user.
You should get one row back.
Two rows means the row-level security policies are wrong.

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

- `docs/plan/build-plan.md` covers who is doing what and what counts as done
- `docs/design/architecture.md` covers the design decisions and the ones that were rejected
- `docs/important_info.md` is the unit brief

## Status

The proposal and design are written.
The application is a skeleton.
Authentication, the brand profile, generation, the editor and the dashboard are not built yet.
`docs/plan/build-plan.md` tracks what is left.
