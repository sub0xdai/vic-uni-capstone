## Build Plan

Target: a deployed, clickable build covering brief items 1 to 5 by **1 November 2026**.

Scope is fixed at brief items 1 to 5: multi-tenant accounts, brand profile, content generator with three content types, LLM integration, and a content editor with save and dashboard.
The evaluation engine stays a stub in the UI so the design still reads as designed.

The stack is the one the proposal already commits to: Next.js on Vercel, Supabase for Postgres, auth and row-level security, OpenAI for generation.

---

## The collaboration problem

Four people, one of whom can carry the build.
The other three need work that they cannot break, cannot get stuck on, and that you can verify without reading their code.

Three mechanisms make that possible. Everything below depends on them.

**1. The preview gallery.**
`web/app/preview/page.tsx` renders every component with fake props.
It needs no database, no API keys and no login.
A teammate runs `pnpm dev` and opens `/preview` to see their work.
This removes the two things that stop weak developers: environment setup and auth.

**2. Draw the hole before you hand out the shovel.**
Nobody is asked to "build a page".
The page already exists, already renders, and already has a placeholder where the work goes.
The task is "replace the placeholder in this one file with these five fields from the mockup".
Copy-and-adjust is achievable. Blank-page design is not.

**3. One file per person, and a file nobody but you may touch.**
Every task names exactly one file to edit.
Shared files are locked.

### Locked files

Only you edit these. If a teammate needs a change here, they ask you.

```
web/app/layout.tsx
web/lib/types.ts
web/lib/supabase/*
web/supabase/schema.sql
web/package.json
web/.env.local
web/middleware.ts
```

### Rules for every teammate, every task

1. Work on a branch named after your task ID. Open a PR. You merge it.
2. Touch only the file named in your task. If you need another file, comment on the issue and wait.
3. Run `pnpm typecheck && pnpm test` before pushing. Both must pass.
4. Do not install any dependency. Ask first.
5. Paste a screenshot of `/preview` into the PR. That is your proof of work.

Rule 4 matters most. Left alone, a struggling developer solves every problem by adding a library.

---

## Week 1, 5 to 11 October: foundation

Yours alone. Nothing here is delegated, because everything else sits on top of it.

| ID | Task | Files | Done when |
|---|---|---|---|
| W1.1 | Scaffold Next.js, deploy to Vercel | `web/*` | A public URL serves the app |
| W1.2 | Supabase project, schema, RLS | `web/supabase/schema.sql` | Four tables exist, RLS blocks cross-tenant reads |
| W1.3 | Auth: sign up, log in, log out, protected routes | `web/app/(auth)/*`, `web/middleware.ts` | Log out then hitting `/dashboard` redirects to login |
| W1.4 | Types, design tokens, preview gallery | `web/lib/types.ts`, `web/app/preview/page.tsx` | `/preview` renders every component with fake data |

**W1.2 acceptance test, run it, do not eyeball it:** create two users with the anon key, insert a profile for each, then read profiles as user A. You must see only user A's row. If you see both, RLS is wrong and the multi-tenancy claim in the proposal is false.

---

## Week 2, 12 to 18 October: profile and generation

| ID | Task | Owner | File | Done when |
|---|---|---|---|---|
| W2.1 | Brand profile form and save | A | `web/components/profile-form.tsx` | `/preview` shows 5 fields, empty submit shows inline errors, Save writes one row |
| W2.2 | Content-type prompt templates | C | `web/lib/prompts.ts` | Three templates exported, `pnpm test prompts` passes |
| W2.3 | `/api/generate` route | you | `web/app/api/generate/route.ts` | Posting a topic returns generated text and inserts a draft row |
| W2.4 | Onboarding redirect | you | `web/app/(app)/layout.tsx` | New user with no profile is sent to onboarding |

Give teammate A the login mockup PNG from `docs/assets/media/image5.png` and the field list. Nothing else.
A's job is markup and a submit handler against a props contract you write first.

---

## Week 3, 19 to 25 October: output and history

| ID | Task | Owner | File | Done when |
|---|---|---|---|---|
| W3.1 | Generator screen | B | `web/components/generator-panel.tsx` | Type selector, topic field, keywords, Generate button, loading state |
| W3.2 | Result panel and editor | B | `web/components/draft-editor.tsx` | Generated text in an editable textarea, copy button works, star rating saves |
| W3.3 | Dashboard draft list | B | `web/components/draft-list.tsx` | Rows show type, topic, date, stars, and delete removes the row |

Week 2 acceptance tests come first. If a teammate is behind, cut their week 3 task to a static version and you wire it.

---

## Week 4, 26 October to 1 November: harden and rehearse

| ID | Task | Owner | Done when |
|---|---|---|---|
| W4.1 | Error and timeout handling, input preserved on failure | you | Kill the API key, confirm a friendly error and no lost input |
| W4.2 | Seed demo data | C | A fresh account has content to show in the demo |
| W4.3 | Manual QA pass on the deployed URL | C | A dated bug list with screenshots exists in `docs/qa/` |
| W4.4 | Scoring stub in the UI | A | The quality card renders with placeholder scores |
| W4.5 | Rehearsed demo, scripted | all | The whole flow runs twice without a failure on the deployed build |
| W4.6 | Wake the Supabase project and exercise it | you | The dashboard shows activity within the last 24 hours, not 7 days |

---

## Continuous, every week, all four of you

| Artifact | Location | Owner |
|---|---|---|
| Individual progress diary | `docs/diary/<name>/2026-W<nn>.md` | each person |
| Weekly meeting minutes | `docs/meetings/2026-W<nn>.md` | rotating |
| Board updates | GitHub Projects | each person, own cards |

The diary is assessed in NIT3004 and per the unit brief must run from the end of NIT3003 until NIT3004 starts.
It starts this week.
Every entry carries a git commit timestamp, which is the evidence that it was written that week and not reconstructed in November.

---

## Board setup

Create the project, then one issue per task above.

```bash
gh project create --owner sub0xdai --title "NIT4001 Implementation"
```

Each issue needs four things, or a teammate will stall:

- The task ID as the title prefix, for example `W2.1 Brand profile form`
- The exact file they are allowed to edit
- The acceptance criteria, copied from the table above
- The linked mockup image, if the task is visual

---

## Standing priorities

If two things conflict, the order is fixed.

1. A working demo on 1 November.
2. The diary and minutes, on time, every week.
3. The proposal revision.
4. The evaluation engine, and with it the HD case.

Nothing below the line happens until everything above it is safe.
