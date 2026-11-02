# Daniel (sub0xdai) - work journal

One file, newest entry at the top, going back to the first commit.
For each piece of work: what I meant to do, what I actually did, how I know it worked, and what I decided.
"How I know" means a commit hash, a file, or a command I can run again. Not memory.
I write down the reason for a decision too, because the reason is what I will have forgotten by November.
Entries get added when something finishes, even if that is late.

## Where things stand, 2 November 2026

- `master` is at `4f4953b` and matches GitHub.
  Seven pull requests merged today, none open, one branch.
- The checks pass: 65 tests, no failures, and the production build makes nine routes.
- The seven pull requests fixed the two bugs Semir found, plus four things nobody had noticed.
  An unreviewed change of mine to a locked file, a form error state that did not exist, a schema with no grants, and a duplicate-click hole proved by a model before it was fixed.
- Both READMEs and the working agreements now describe the build that exists.
- Not done: the grants query has to be run by whoever holds the Supabase project.
  Nothing has been exercised end to end against a live database, deployed, or load tested.

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
