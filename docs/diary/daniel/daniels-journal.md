# Daniel (sub0xdai) - work journal

One file, newest entry at the top, going back to the first commit.
For each piece of work: what I meant to do, what I actually did, how I know it worked, and what I decided.
"How I know" means a commit hash, a file, or a command I can run again. Not memory.
I write down the reason for a decision too, because the reason is what I will have forgotten by November.
Entries get added when something finishes, even if that is late.

## Where things stand, 31 October 2026

- `master` is at `7d63497` and matches GitHub. Six pull requests merged this week, none open.
- The checks pass: 53 tests, no failures, and the production build makes seven pages.
- Two bugs are still live, both found by Semir on a real database. Login never works in the browser, and a fresh database answers "permission denied" until someone grants access. Both sit in files only I am supposed to touch, so I am fixing them.
- Not done: a live database, a deployed URL, and an API key for the AI. Two board cards depend on that, and the 1 November demo depends on those cards.

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
