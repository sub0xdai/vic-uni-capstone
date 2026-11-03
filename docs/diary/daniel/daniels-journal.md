# Daniel (sub0xdai) - work journal

One file, newest entry at the top, going back to the first commit.
For each piece of work: what I meant to do, what I actually did, how I know it worked, and what I decided.
"How I know" means a commit hash, a file, or a command I can run again. Not memory.
I write down the reason for a decision too, because the reason is what I will have forgotten by November.
Entries get added when something finishes, even if that is late.

## Where things stand, 4 November 2026

- `master` is at `83cc64b`, and this entry rides on top of it.
- The checks pass: 87 tests, typecheck and lint clean.
- The database has now been audited against the Supabase row level security guide rather than against our own README.
  The two tenant tables hold, checked again on the live project with one fresh account of mine and a user id that was not mine.
- `model_rate` was the defect: row level security on, no policy, so every client read answered `[]` and the dashboard printed "No rate on record for this model" instead of a cost.
  That means F3 is merged but its cost figure was dead on the live project.
- The fix is `02e7872`: a select-only policy, no write grant, and grants named table by table with no default privileges.
  It needs one paste in the Supabase SQL editor before it takes effect, and that paste has not happened.
- I read every piece of feedback we hold against the code. Of the audit's eight findings, one is fixed, two are half done and five have not moved.
  The proposal gaps (G5) are the largest and they are pure writing.
- Still true: nothing deployed, nothing load tested, no raters for the evaluation experiment.

## Where things stand, 3 November 2026

- `master` is at `7de2d90` and matches GitHub. Nine pull requests merged today, two closed, none open.
- The checks pass: 76 tests on master, 86 on the open F3 branch, typecheck and lint clean.
- The instructor's five architectural recommendations are answered in `docs/design/response-to-feedback.md`, and four of them are cards F1 to F4.
  F1, F2 and F3 are merged. F4 waits on the evaluation experiment.
- The tenancy rules ran against the live project for the first time and held, recorded in `docs/plan/tenancy-check.md`.
- A blog outline was generated and rated through the browser, and the score moved when it was rated.
  That was the last unverified claim in the report.
- Not done: the `usage` migration has not run on the live project yet, so generating from `master` would fail to save a draft. Nothing is deployed, nothing is load tested, and the evaluation experiment still has no raters.

## Where things stand, 2 November 2026

- `master` is at `4f4953b` and matches GitHub.
  Seven pull requests merged today, none open, one branch.
- The checks pass: 65 tests, no failures, and the production build makes nine routes.
- The seven pull requests fixed the two bugs Semir found, plus four things nobody had noticed.
  An unreviewed change of mine to a locked file, a form error state that did not exist, a schema with no grants, and a duplicate-click hole proved by a model before it was fixed.
- Both READMEs and the working agreements now describe the build that exists.
- Not done: the grants query has to be run by whoever holds the Supabase project.
  Nothing has been exercised end to end against a live database, deployed, or load tested.

## 4 November 2026 - the database audited against the guide, not the README

Meant to: answer "do we have row level security on the live project" with an observation rather than with our own schema file.

I read the Supabase guide first, then `supabase/schema.sql` against it.
Two of the three tables looked right: security enabled, four policies each, a `with check` on insert and update.
Two things did not.
`model_rate` had no `enable row level security` line at all, and the grants were a blanket `grant all on all tables in schema public to authenticated` plus three `alter default privileges` rules.
That pair is the trap. Any table created after that statement hands write access to every signed-in user, and nothing in the file says so.

Then I probed the live project instead of reasoning about it, with a throwaway account made through the same signup path the app uses.
Anon reads returned empty, my own insert came back 201, and an insert naming a user id that was not mine came back 403.
An unfiltered read returned only my row, so the select policy does its job with no filter to help it.
The tenancy claim survived a second, independent check.
The one thing I did not exercise is delete: a delete scoped to my own id answered 204, and a 204 means accepted rather than "removed rows", so it proves nothing about the policy. The tenancy record already lists delete as uncovered and it still is.

`model_rate` was where it got interesting.
An insert from a signed-in account was refused with "new row violates row-level security policy", not "permission denied".
That is the difference between a policy problem and a grant problem, and it told me the live table already had security enabled with no policy on it.
Security with no policy reads as an empty list, not an error, so nothing anywhere logged a fault.
The dashboard read no rates, `monthlySpend` returned a null cost by design, and the page said "No rate on record for this model" in plain English.
F3 is merged and its own acceptance line is "the dashboard shows month to date cost".
On the live project it did not, and no test failed, because the test reads the SQL file and the file never mentioned `model_rate`.

Decided:

- `model_rate` is read only to clients. The rate decides the cost shown back to that user, so a writable rate lets someone zero out their own usage. Select policy for `anon` and `authenticated`, no write grant.
- Name every grant table by table and delete the default privileges. A new table should start with no client access and have to state its own grant next to its own policies.
- Keep anon's select on the two tenant tables even though security makes it return nothing. Revoking it would turn the documented `200 []` into `permission denied`, and the tenancy record's negative check depends on that empty list.
- Put the regression in `lib/schema-sync.test.ts`, so an edit that reopens the table fails a test rather than showing up as a blank cost figure in a demo.

How I know: `02e7872`, plus a real database rather than a reading.
`schema.sql` applied to Postgres 16 in a container with a stubbed `auth.uid()`, then run as three roles.
Anon saw the seeded rate and zero profile rows; tenant A saw one row unfiltered and got `permission denied` on both writes to `model_rate`; tenant B's insert naming tenant A came back as an RLS violation.
I also reproduced the live shape exactly, security on with the policy missing, and the new migration restored reads and still refused writes.
87 tests pass.

Mistakes worth keeping:

- I wrote "the table is empty" after seeing `200 []` on `model_rate`. That response is identical for an empty table and for a table security will not show me, and I asserted before I knew which. The insert error message is what separated them. Read the error, not the row count.
- My first version of the grants deleted anon's select on the two tenant tables. It looked cleaner and it broke a documented behaviour, turning an empty list into `permission denied`. The container run caught it.
- Four throwaway accounts now sit in the live project, mine and the tenancy check's two, and `SUPABASE_SERVICE_ROLE_KEY` is still empty so deleting them is a dashboard job. The handoff says so now.
- `master` accepted a direct push of mine with the message "bypassed rule violations, changes must be made through a pull request". The bypass is the admin exemption I added myself on 2 November. Worth remembering before I lean on the rule to protect me from a mistake.

Also today: I read `devlog.md`, `docs/plan/review-notes.md` and `docs/design/response-to-feedback.md` against the build instead of against each other.
Of the audit's eight findings, one is fixed, two are half done and five have not moved.
The half that hurts is the same one both reviewers named: the metrics exist and nothing validates them.
G5 is next after the paste and the deployment, because it is the one category named twice and it needs no code.

## 3 November 2026 - the feedback answered, the tenancy proved, five merges

Meant to: answer the instructor's architecture feedback with something measurable, and stop guessing about the database.

The feedback arrived as five recommendations: dynamic prompts, cost engineering, provider flexibility, contextual personalisation, feedback loops.
I wrote `docs/design/response-to-feedback.md` answering each against the build rather than against the proposal, and declined two with reasons.
Prompt shortening is declined on arithmetic: a 76-word system prompt and a 47 to 60-word user prompt is about 190 input tokens against a 1024-token output cap, so cutting the prompt by a third saves under 5 percent of a call.
An agent layer for personalisation is declined because the route already fetches the profile row and injects it, and the missing piece is two columns, not a service.
The other three became F1, F2 and F3, and the fifth is G3, which was already carded.

The evaluation gap is the one the first reviewer named, so I ordered the cards to protect it.
G3 needs real drafts and human ratings, and it cannot start while the score ignores ratings.
That was F1: satisfaction carries 35 percent of the weight and was computed once, from a null rating, so every stored report held the neutral 0.5 forever.
`applyRating` now replaces that one metric, re-derives the overall score from the weights, and validates both the report it received and the report it returns.
My first version silently repaired a drifted report instead of refusing it, and a test caught it. Refusing is the point of `lib/score.ts`.

F2 was the claim in `architecture.md` 3.7 that the provider boundary existed. It did not.
`lib/generator.ts` is now the port, `lib/gemini.ts` the only module that knows Gemini's shapes, and provider, model and base URL resolve from configuration.
The build started on OpenAI and moved to Gemini, which is exactly why the boundary matters and why the five diagrams in section 5 are now a stale drawing rather than a stale design.

Then the database.
The README said there was no live project. There was one, so I probed it over REST: both tables answered, and `generated_content` had `idempotency_key`, so the schema and Semir's migration had landed.
The isolation test had never run, and the README described it as something you can see in the app, which is wrong: every page adds `.eq("user_id", ...)`, so a working filter and a working policy look identical in a browser.
I ran it as an unfiltered query with each user's own token.
One row each, nothing without a token, a cross-tenant insert refused with 403, a cross-tenant update changing nothing, and a draft invisible to the other account.
The tenancy claim in the report is now measured.

How I know: nine commits, `b19d9c4` for the scan, `3623eac` for the answer and the cards, `e1d5d31` for F1, `b686fc4` for F2, `6f21b6c` for the board, `8cb15e2` for the READMEs, `41a4657` for the tenancy record, `06bf0eb` for the browser path, and `586f131` for F3, which is still open.
76 tests pass on master and 86 on the F3 branch.
Generating 187 input and 96 output tokens priced at $0.000057, which is the arithmetic the cost work rests on.

The PII scan landed too, because the project had no hook and the code has a key path in it.
Presidio's default wants a 600 MB spaCy model and tries to download it by shelling out to `uv`, which failed silently here and would have blocked every commit, so it uses `en_core_web_sm` from a pinned wheel.
The scan also fires on any field named `apiKey`, because the pattern is deliberately blunt, so ten lines carry a waiver saying which kind of non-secret each one is.

Decided:

- Close Semir's rating route instead of merging it.
  Rating is the only write with nothing server-side in it, and the browser already writes profile, draft text, status and delete straight to Supabase.
  One API route for one column makes rating the odd one out and leaves two ways to write the same field.
- Card the feedback rather than build all five.
  Five shallow items would leave the evaluation experiment unbuilt, and that is the assessed gap.
- Put prices in a table, and label the seeded number a placeholder.
  There is no published price to copy for a model whose name is a placeholder, and inventing one quietly is worse than saying so.
- Keep the hook's exit 0 when `.venv` is missing.
  It is the canonical behaviour, so a clone without Python is not blocked from committing, even though the scan does not run.

Mistakes worth keeping:

- I told myself the project had zero users. The listing call returned 401 because `SUPABASE_SERVICE_ROLE_KEY` is empty, and `jq` turned the error into `[]`, which I read as an empty list.
  The test still stands, because each account saw exactly one row, but the claim was wrong when I made it.
- The hook exiting 0 without a venv is the kind of guard that passes by not running. I only noticed because I re-ran it in a fresh worktree.
- My global `~/.config/uv/uv.toml` was invalid, and I worked around it with `--no-config` for an hour before reading the message properly. It broke every `uv` command on the machine, not just here.
- I left a placeholder shaped like an email address in the preview gallery, and the scan refused my own commit. The placeholder is now words instead of an address.
- I branched the handoff off F3's tip instead of off master, so its squash (`7de2d90`) carried a whole card into master with it.
  The tree is right and 86 tests pass, but the history now shows one commit doing two unrelated things, which is the one thing squash merging is supposed to prevent.
  The habit that fixes it is mechanical: check out master before creating a branch.

## 2 November 2026 - the gate, two missing pieces, and a run I could check

Meant to: merge what the team sent and close the demo gap.

Did, in this order.

Audited the repository rather than the board.
`master` was not protected at all, so anyone with write could push to it.
PR #63 had been merged by its own author, with an empty description, no review, and a merge commit while every other card landed as one squash commit.
It also edited `lib/supabase/client.ts` and `app/layout.tsx`, both on the locked list.
The diagnosis in it was right, so I kept the fix and removed three things it left behind.
A comment block, a stray blank line, and a second copy of the env-reading path that repeated an error message `supabaseBrowserResult` already built.

Protected `master`: pull request required, one approval, stale approvals dismissed, no force push, no delete, admin bypass so my own cards still merge.
Then deleted eleven dead branches, including two root-level copies of the app from before the move into `web/`, and moved the nine cards that actually shipped from `todo` to `done`.

Wrote the generation flow as a TLA+ spec instead of arguing about it.
Two invariants: the monthly limit holds, and one click never makes two drafts.
TLC broke both on the same path, because the route counts this month's drafts, then calls the model, then inserts, with no idempotency key and no constraint.
The fix is three layers.
A latch in the browser so a same-frame double click sends nothing, a key per click that the route replays, and a partial unique index as the backstop.

Built the scoring engine.
`lib/score.ts` had weights, a threshold and drift checks, and nothing imported it, so the dashboard showed hardcoded placeholders.
`lib/evaluate.ts` now computes readability from reading ease, keywords from coverage, structure from per-type checks, tone from a warmth heuristic, and satisfaction from the star rating.
The route writes that report into the `analysis` column that was already in the schema.

Two bugs arrived from Semir as complaints rather than cards.
The blue box in his screenshot was browser autofill painting over an input, which no `background-color` can win, so the fix is a transition delay plus a pinned text colour.
The second one was better.
He typed into the "field with an error" example and nothing happened.
The example was read only, and worse, the error state had never been styled, so an invalid field looked identical to a healthy one in every form in the app.

Then the local run.
Filled `.env.local` against the team's Supabase project, restarted, and got `401 You must be logged in` from the generate route, which is the right answer and proves the wiring.
Checked the project directly over REST and got `permission denied for table generated_content`.
The project predates today's grants fix, so the tables exist and nothing may read them.
That query has to be run by whoever holds the account, so I wrote it out for them and stopped there.

How I know: seven commits.
`7ed91fd` for the guard and the scorer, `844e66b` for autofill, `80f38f5` for the field error state, `75d1413` for the grants, `a078220` and `4f4953b` for the docs, `15d7d50` for the cleanup.
65 tests pass and the build makes nine routes.
The unique index is proved on a real Postgres 16, where the second insert with a repeated key fails with `duplicate key value violates unique constraint` and two rows with a null key both insert.
The grants are proved the same way.
With them, `authenticated` reads zero rows and no error.
After `revoke`, the same select answers `permission denied for table generated_content`.

Decided:

- The gate is a real setting, not a habit.
  A rule everyone agrees to and nobody enforces held for six pull requests and broke on the seventh.
- Do not build `app/api/profile/route.ts`.
  The card asked for an endpoint, and saving already works through one upsert with a unique constraint behind it.
  A second write path changes nothing a user can see.
- Keep the admin bypass.
  With one person carrying the build, waiting for an approval from someone who cannot review is worse than the risk.
- No CI.
  The checks run locally, and a broken workflow would add a failure mode before the demo rather than remove one.
- Write the tone metric down as a heuristic in the code, the README and the board.
  It scores neutral copy at 0.86 for professional and 0.26 for friendly.
  Calling it a judgment would repeat the mistake the proposal was marked down for.
- Put the model in the reader's words.
  A chart nobody can read is a chart nobody uses, and my first version had paragraph-long labels that all collided.

Mistakes worth keeping:

- I claimed the autofill fix worked before running anything, and had to be told twice to produce an artifact.
  My first proof was also wrong, because I applied the class before first paint and measured nothing.
- My first reading of "you didn't finish the function" went looking for missing API routes.
  Semir was pointing at a test field he could not type in.
- I started a dev server detached in the background and then told someone else to run the same command.
  That is where the port conflict came from.

## 31 October 2026 - six pull requests read, repaired, merged

Semir sent six. I read each one, fixed what was wrong, and merged them in the order they depended on each other. Each pull request became a single commit on master (`59131b8`). I fixed things rather than bouncing a branch back to him, partly because the clock is short and partly because he had done the hard part already.

What was actually broken:

- The restyle added a second "Top favourites" box on the dashboard and never removed the first, so the page showed the same list twice.
- The generate endpoint died with an empty 500 when a database setting was missing, so the page had nothing to show the user. It now returns a sentence.
- The same endpoint passed raw database errors back to the browser. Now it logs them and tells the user to try again.
- The monthly limit was counted by UTC on the server and by the browser's own clock on the dashboard. For anyone in Melbourne those two disagree for part of every day. Both use UTC now.
- Nothing linked to the generate page, so it only existed for whoever typed the address.
- Two links at the bottom of that page ran together as "Go to business profileBack to dashboard".
- The new buttons still had the old grey borders from before the restyle.

Two of the branches also had to be rebuilt on master first. They were cut before the earlier work was squashed, so git reported 13 and 16 changed files when the real content was 3 in each.

How I know: checks on the merged result, not on the branches. 53 tests pass, the build makes seven pages, every page loads in a real browser, and I called the generate endpoint with curl to see its 400 and its 500 answers.

Decided:

- Keep Gemini. The proposal says OpenAI, but Jamal's route already worked, had been tested against a real database, and calls the API directly, so no library was added. I put the key name in the example env file and the readme.
- Edit the shared files myself instead of asking Semir to reopen a branch I had just merged.
- Squash each pull request into one commit, so the history reads as one card per commit and the abandoned early copies stay out of it.

Still open, in plain terms:

- The browser code asks for a database setting by name, and the build tool only hands over settings it can see written out in full. So the browser always gets nothing and login can never work.
- The database file sets up the security rules, which decide who may read which row, but never grants permission to touch the tables at all. A fresh project therefore rejects every query. That is the "permission denied" Semir hit.
- A fresh checkout fails the type check with "Cannot find name LayoutProps" until something has run the build once. The fix is reordering the commands in `package.json`, one of the files I keep locked, so I want to do that as a deliberate change.

## 29 October 2026 - closed #54, moved the work, wrote the rules

Semir's first pull request (#54) was cut before the app moved into `web/`. It added a second copy of the app at the top of the repo, with its own settings and its own dependency lock. Git merged it with no conflict at all, because the two copies never touched the same file. That silence is the dangerous part.

So I closed it, moved his four screens into `web/` so the work was not lost, and left his name on the commit that carries his code.

Then I wrote `docs/plan/working-agreements.md` from what went wrong: start from the latest master, one app, copy column names out of `schema.sql`, run the checks and the build before asking for a review, do not hide a missing setting, one card per pull request. Same day I added the parsers that check incoming data, the profile validation and the error page (`de66b1a`), and gave the preview page two different drafts so the coloured status labels could finally be seen (`7f3daa4`).

The form sent "Professional" into a column that only accepts lowercase, treated row ids as numbers when they are long strings, and the dashboard read a quality score column that does not exist. That last one would not have crashed. It would have shown zero, which is worse, because zero looks like an answer. That is the mistake the rules exist to catch.

Decided: four people, one of whom writes code. One file per person, the shared files locked, and a preview page that needs no database, no keys and no login, so a teammate can see their work with one command.

## 2 October 2026 - markdown, an architecture, and the first real code

Turned the submitted Word document into 14 markdown sections, then built the Word file back out of them with pandoc (`2e5ea49`). The build reuses the original file as its style template, so the output keeps the formatting it was marked on. From then on I edit markdown and never the docx.

Wrote `docs/design/architecture.md`: eleven patterns with the reason for each, the approaches I rejected, and the gaps I knew were still there.

Started the app: Next.js 16, TypeScript, Tailwind, and a middleware file that checks the session. Then the domain types as fixed lists of allowed values, the parsers for incoming rows, the assertion helpers and the quality score model, each with tests (`5fb0ec0`). 25 tests by the end of that day.

Built `/preview`, a page that renders every component with fake data, and four placeholder components, so the holes were drawn before anyone was handed a shovel. Wrote the board tool and the card briefs too (`d052439`), which created 43 issues and 7 labels.

Decided:

- Allowed values live once, in TypeScript and in the database, and a test reads `schema.sql` and fails if the two lists drift. A typo should stop the build, not turn up as a zero three weeks later.
- Errors come back as values at the edges instead of being thrown, and a missing setting names itself instead of being silenced with a bang.
- Locked files with one owner. I would not defend that on a team of experienced developers. Here it is the only version that fits in four weeks.

Still open: the scoring engine stays a stub in the interface until after the demo (card G2).

## 2 October 2026 - the audit, or: seven months, no code

Checked the proposal against the ten session checklists, because no marking rubric exists anywhere (`docs/plan/review-notes.md`). The repo still held documents only, four commits, seven months after the design unit ended. The progress diary and the weekly meeting notes did not exist at all, and the team's own timeline scheduled the diary as a six day task starting 2 November, the week the second unit begins. That is a record written afterwards, not during.

Rewrote the build plan around a fixed date: something deployed and clickable by 1 November (`d052439`).

Decided:

- Rebuild the concept rather than replace it. The complaint was that the design had no engineering depth, not that the problem was invented. The depth goes into measuring whether the generated text is any good, which is cards G2 to G4.
- Requirements traceability, meaning an ID on every requirement and a way to measure each non functional one, gets its own card (G5) instead of a rewrite of all fourteen sections now.
- The plan says out loud that one person is writing the code, because a contribution table the diary contradicts is worse than an uneven split.

Honest note: the missing diary was known on 2 October and the first entry in the repo is 31 October. A month went by on something that gets marked, and that belongs in the record rather than nowhere.

## 25 July 2026 - tidy up

Renamed the proposal and the slides so they match the folder, and replaced the one line readme with a real one (`5779d80`, `177d8e9`). Nothing else happened between March and October.

## 15 March 2026 - the proposal came back, and the criticism was right

Wrote the feedback into `devlog.md` instead of leaving it in an email.

The part that stung, roughly: it was hard to find deeper technical thinking, especially about how you would evaluate or benchmark AI written content. It read like a description of a tool rather than a design.

Decided:

- Take it, do not argue with it. A wrapper around a chatbot, with a free alternative already on the market, is not a capstone.
- The five scores and the 0.6 regenerate threshold were asserted with nothing behind them. Making them measurable, and then testing that they measure the right thing, becomes the engineering substance of the second unit instead of an appendix to it.

Still open: everything. What I wrote that day was "TBD".

## 12 March 2026 - a development process document

Wrote `docs/AIDLC.md`, a plan / do / check loop where every step leaves a file behind for the next one (`8ce2ee6`). It is why the board, the card briefs and the locked file list exist later. I did not follow the document to the letter.

## 8 March 2026 - the proposal and the slides

First commit, then the proposal and the presentation (`446abdc`, `a2af03b`). The design unit ended with two files and no code.
