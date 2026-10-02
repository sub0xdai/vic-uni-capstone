# Build plan and board

Target: a deployed, clickable build covering brief items 1 to 5 by **1 November 2026**.

Today is 2 October. The gate is the demonstration in the first week of the second unit. Everything before the gate line exists to make that demonstration work.

Scope is fixed at brief items 1 to 5: multi-tenant accounts, brand profile, content generator with three content types, LLM integration, and a content editor with save and dashboard.
The evaluation engine stays a stub in the UI so the design still reads as designed, and gets built after the gate.

The stack is the one the proposal already commits to: Next.js on Vercel, Supabase for Postgres, auth and row-level security, OpenAI for generation.

Owner names match the contribution split the team agreed on, so the board and the contribution table do not contradict each other.

GitHub accounts, so cards can be assigned and filtered: Daniel `sub0xdai`, Semir `rimez-max`, Hailu `Mostx33`, Jamal `Jhusvex`.
Six cards are shared rather than owned, and stay unassigned: `C0`, `C1`, `C2`, `W4.5`, `G5` and `G6`.

| Member | Agreed area from the proposal | Cards |
|---|---|---|
| Daniel | Aim and scope, pseudocode, UI designs, content display UI | W3.1, W3.2, W3.3, plus every card that needs application code, because he is the only member who builds |
| Semir | Functional requirements, use cases, database schema, content table, rating system | W2.1, W3.4, W4.4, G5 |
| Hailu | Introduction, risk management, authentication, conclusion | W1.3, W4.2, W4.3 |
| Jamal | Non-functional requirements, sequence and UML, resources, AI API integration, prompt engineering | W2.2, G1 |

Two honest notes about this table.

**It is uneven on purpose.**
The agreed split was drawn from the design phase, where the work was writing report sections.
The implementation phase is different work and the split does not divide it cleanly.
The cards that need application code sit with Daniel because he is the only member who writes it, and pretending otherwise would put the November demonstration at risk.

**A contribution claim needs diary support.**
The unit assesses individual contribution through the progress diary.
When a card changes owner, record the change and the reason in the diary and in a comment on the card.
An honest reassignment with evidence costs nothing.
A contribution table that the diary contradicts is worse than an uneven split.

Where the split can be honoured without risking the build, it is.
`W1.3` is scoped to the sign up, log in and log out screens, which is the visible part of authentication that can be built and checked on `/preview`, while the session and security layer stays with Daniel.

---

## Board

Three columns. The In Progress column is empty on purpose: nothing has been started that is not finished.
Work in Progress limit is four, one per person. If your column is full, finish something before starting something else.

Owner labels are `sub0xdai`, `A`, `B` and `C`. `sub0xdai` is the orchestrator and is assigned on GitHub. Replace `A`, `B` and `C` with the real team names once you create the board.

### To do

Ordered by critical path. Do not start a card whose dependency is still open.

| ID | Card | Owner | File or area | Done when | By |
|---|---|---|---|---|---|
| C0 | How to work on a card | everyone | this document | You have run the app and seen `/preview` | before you start |
| W1.2 | Supabase project, schema applied, RLS verified | Daniel | `web/supabase/schema.sql` | Two users, insert a profile each, read as user A, one row comes back | 11 Oct |
| W1.1 | Fill `.env.local`, deploy to Vercel | Daniel | Vercel project settings | A public URL serves the app | 11 Oct |
| W1.3 | Auth screens: sign up, log in, log out | Hailu | `web/app/(auth)/*` | A new account can register and reach onboarding | 11 Oct |
| W1.4b | Host pages behind auth | Daniel | `web/app/(app)/{dashboard,generate,onboarding}` | Each page renders its shell while logged in | 11 Oct |
| W1.6 | Create the board and load these cards | Daniel | GitHub Projects | Every card above appears in TODO | 11 Oct |
| C1 | Progress diary, this week onward | each person | `docs/diary/<name>/2026-W<nn>.md` | A dated entry per person per week | 11 Oct |
| C2 | Weekly meeting minutes | rotating | `docs/meetings/2026-W<nn>.md` | One file per week, attendees and decisions | 11 Oct |
| W2.1 | Brand profile form | Semir | `web/components/profile-form.tsx` | `/preview` shows five fields, empty submit shows inline errors | 18 Oct |
| W2.2 | Content-type prompt templates | Jamal | `web/lib/prompts.ts` | The skipped acceptance test in `prompts.test.ts` is unskipped and passes | 18 Oct |
| W2.3 | `/api/generate` route | Daniel | `web/app/api/generate/route.ts` | Posting a topic returns text and inserts a draft with its generation parameters | 18 Oct |
| W2.4 | Profile read and write | Daniel | `web/app/api/profile/route.ts` | Save writes one row, reload shows the saved values | 18 Oct |
| W1.4a | Protected route check | Daniel | `web/proxy.ts` | Logged out, `GET /dashboard` redirects to `/login` | 18 Oct |
| W3.1 | Generator input panel | Daniel | `web/components/generator-panel.tsx` | Type selector, topic, keywords, Generate button, loading state | 25 Oct |
| W3.2 | Draft editor and actions | Daniel | `web/components/draft-editor.tsx` | Editable text, copy works, rating saves | 25 Oct |
| W3.3 | Dashboard draft list | Daniel | `web/components/draft-list.tsx` | Rows show type, topic, date, stars, and delete removes the row | 25 Oct |
| W3.4 | Rating persistence | Semir | `web/app/api/rating/route.ts` | A rating survives a reload | 25 Oct |
| W4.4 | Scoring stub quality card | Semir | `web/components/quality-card.tsx` | The card renders five metrics with placeholder scores | 25 Oct |
| W4.1 | Error and timeout handling | Daniel | `web/app/api/generate/route.ts` | Remove the API key, a friendly error appears and input is kept | 1 Nov |
| W4.2 | Seed demo data | Hailu | `web/supabase/seed.sql` | A fresh account has content to show | 1 Nov |
| W4.3 | Manual QA pass | Hailu | `docs/qa/` | A dated bug list with screenshots exists | 1 Nov |
| W4.5 | Rehearsed demonstration | all | the deployed build | The whole flow runs twice without a failure | 1 Nov |
| W4.6 | Wake the Supabase project | Daniel | Supabase dashboard | Last activity is within 24 hours, not 7 days | 1 Nov |
| W4.7 | Double-submit guard | Daniel | schema plus generate route | Two rapid clicks create one draft and one model call | after W4.1 |

**Gate: working demonstration, 1 November**

| ID | Card | Owner | File or area | Done when | By |
|---|---|---|---|---|---|
| G1 | Regenerate the five diagram PNGs | Jamal | PlantUML source in section 5 | Five images inserted, the stale `image10.png` removed | Nov |
| G2 | Evaluation engine, local scoring | Daniel | `web/lib/evaluate.ts` | Readability, tone, keyword and structure metrics return 0 to 1 | Nov |
| G3 | Evaluation experiment | Daniel | `docs/design/evaluation.md` | A labelled set, a human rating round, and an agreement statistic | Nov |
| G4 | Load test against the NFR targets | Daniel | `docs/design/loadtest.md` | Measured numbers, and the NFRs revised to match them | Nov |
| G5 | Proposal gaps closed | all | sections 2, 3, 4, 9, 10 | `FR-` identifiers, MoSCoW, NFR measurement column, use case exception flows, risk register with owners | Nov |
| G6 | Second unit deliverables | all | report, poster, diaries | Submitted | Nov |

### In progress

Empty. Nothing started that is unfinished.

### Done

A card belongs here when it is verifiable, not when a file exists.
Scaffolding counts, because a scaffold is either building or it is not.
A feature does not count until it has been exercised.
The schema is the clearest example: it is written, it has never been run against a database, so `W1.2` stays open until the two-user isolation test passes.

| ID | Card | Note |
|---|---|---|
| D1 | Proposal and design submitted | NIT3003, marked, feedback received |
| D2 | Proposal converted to per-section markdown | `docs/sections/`, 14 files, generated from the docx |
| D3 | docx build pipeline | `make docx`, keeps Word styling, numbering and all 10 images |
| D4 | Architecture design doc | Pattern catalogue, rejected approaches, known gaps |
| D5 | Section 5 rewritten | Five single-scenario sequence diagrams replacing the single contradictory one |
| D6 | Contribution table resynced | Section 12 now matches section 5 |
| D7 | App scaffold | Next.js 16, TypeScript, Tailwind, `proxy.ts` session guard. Builds and serves |
| D9 | Domain types | Closed sets as sum types, `Result`, boundary parsers, tests passing |
| D10 | Invariant layer | `invariant`, `assertInRange`, `requireEnv`, `optionalEnv`, tests passing |
| D11 | Quality score model | Weights and threshold as code, drift detection, tests pinning each weight |
| D13 | Preview gallery | `/preview` renders every component with fake data, no keys, no login. Returns 200 |
| D14 | Four component shells | Fixed props contracts, visible not-built panels |
| D15 | Test harness | `pnpm check`, 25 tests, enum sync between TypeScript and SQL |
| D16 | README | Verified against every path and command it names |
| D17 | Marking criteria derived | The unit's own ten section checklists read as the criteria, since no rubric is published |
| D18 | Proposal audited | Findings recorded in `docs/plan/review-notes.md` |
| D19 | Implementation gap identified | No code existed seven months after NIT3003, recorded in `docs/plan/review-notes.md` |
| D20 | Board cards created | 43 issues and 7 labels, seeded from this document |

---

## The collaboration problem

Four people, one of whom can carry the build.
The other three need work they cannot break, cannot get stuck on, and that you can verify without reading their code.

Three mechanisms make that possible. Everything above depends on them.

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
Every card names exactly one file to edit.

The amber panels on `/preview` double as the progress board.
Four amber panels today.

### Locked files

Only you edit these. If a teammate needs a change here, they ask you.

```
web/app/layout.tsx
web/lib/types.ts
web/lib/assert.ts
web/lib/env.ts
web/lib/score.ts
web/lib/supabase/*
web/supabase/schema.sql
web/package.json
web/.env.local
web/proxy.ts
web/tsconfig.json
```

### Rules for every teammate, every card

1. Work on a branch named after your card ID. Open a pull request. You merge it.
2. Touch only the file named in your card. If you need another file, comment and wait.
3. Run `pnpm check` before pushing. It must pass.
4. Do not install any dependency. Ask first.
5. Paste a screenshot of `/preview` into the pull request. That is your proof of work.

Rule 4 matters most. Left alone, a struggling developer solves every problem by adding a library.

---

## Creating the cards

`gh` needs the project scope before it can write to a board.

```bash
gh auth refresh -s project
gh project create --owner sub0xdai --title "NIT4001 Implementation"
```

Then add the cards. Either paste the tables above into the board as draft items, or create them as issues so the board can pull them in by label:

```bash
gh label create todo --color FFD700 --description "Not started"
gh label create "owner-a" --color 1D76DB --description "Teammate A"
gh label create "owner-b" --color 1D76DB --description "Teammate B"
gh label create "owner-c" --color 1D76DB --description "Teammate C"
```

Each issue needs three things, or a teammate will stall: the exact file they may edit, the done-when line from the table, and the linked mockup image if the card is visual.

---

## Standing priorities

If two things conflict, the order is fixed.

1. A working demonstration on 1 November.
2. The diary and minutes, on time, every week.
3. The proposal gaps.
4. The evaluation engine, and with it the case for a high distinction.

Nothing below the line happens until everything above it is safe.

---

## Card briefs

A card whose title matches a heading below uses that section as its description on GitHub.
Everything else uses the short summary from the table.
So the long version of a card lives here, once, and the board pulls it in.

### How to work on a card

You do not need to understand the whole project.
You need to change one file and be able to see the result.

**Getting it running.**
Install Node and pnpm once, then:

```bash
git clone git@github.com:sub0xdai/vic-uni-capstone.git
cd vic-uni-capstone/web
pnpm install
pnpm dev
```

Open `http://localhost:3000/preview` in a browser.

That page shows every part of the app filled with fake data.
It needs no database, no account and no keys.
It works as soon as those four commands finish.

**Finding your work.**
Your card names one file.
Open it in any editor.

The file already exists and already runs.
It shows an orange box saying "not built" and lists what belongs there.
Replace that box with the real thing.

**Knowing you are finished.**
Open `/preview` and look at it.
If the orange box is gone and you can see what the card describes, you are finished.

Do not judge it by reading the code.
Judge it by looking at the page.

**Two rules.**

Change only the file your card names.
If you think you need a different file, comment on the card and wait.

Do not install anything.
If something seems to need a new tool, comment on the card instead.

**If you get stuck.**
Comment on the card with what you see and what you expected, and a screenshot of `/preview`.
Do not sit stuck for more than half an hour.

**Words you will see.**

- **Preview**, the page at `/preview`. It shows every part of the app with fake data. This is your workbench.
- **Component**, one piece of a page, such as a form or a button. Your card names one.
- **Draft**, a piece of generated marketing text that the user saved.
- **Profile**, the business details the user enters once, such as their tone and their audience.
- **Repository**, the folder of files on GitHub that you get from the commands above.
- **Supabase**, the service that stores data. You will not need to touch it.
- **Deploy**, putting the app on the internet so other people can open it. One person does this.

### Auth screens: sign up, log in, log out

Three screens that let a person get in and out of the app.

The secure part underneath, keeping people logged in and stopping strangers reaching private pages, is already built.
This card is the visible part only.

**Where** `web/components/auth-form.tsx`

**Picture**

![Login screen](https://raw.githubusercontent.com/sub0xdai/vic-uni-capstone/master/docs/assets/media/image5.png)

**Finished when**, on `/preview`:

- An email field and a password field, each with a visible label
- A password hint saying at least 8 characters
- A Log in button, full width
- A link underneath saying "Don't have an account? Sign up"
- Clicking that link swaps the card to sign up, adding a Confirm password field, without leaving the page
- Pressing Log in with an empty field shows a red message under that field
- An error message appears under the field it belongs to, never as a popup

### Brand profile form

The form where a business owner writes down what their business is.
Everything the app generates later depends on this.

**Where** `web/components/profile-form.tsx`

**Now** The file already runs, and `/preview` shows an orange box listing the fields. Replace that box.

**Finished when**, on `/preview`:

- Five fields: Business name, Industry, Description, Target audience, Brand tone
- Brand tone is a dropdown with exactly Professional, Casual and Friendly
- Pressing Save with an empty field shows a red message underneath that field
- Pressing Save with everything filled shows no error at all

Copy the styles from the top card on `/preview` rather than inventing new ones.

### Scoring stub quality card

A small card of quality scores shown under the generated text.
The numbers are fixed placeholders for now. Real scoring comes later.

**Where** `web/components/quality-card.tsx`

**Finished when**, on `/preview`:

- Five rows: Readability, Tone, Keywords, Structure, User satisfaction
- Each row shows a bar and a number between 0 and 1
- The overall score is shown larger than the rest
- A row at 0.8 or above is green, 0.6 or above is amber, below 0.6 is red

### Generator input panel

The left half of the main screen.
The user picks what kind of content to make and what it should be about.

**Where** `web/components/generator-panel.tsx`

**Picture** Look at the left column.

![Content generator screen](https://raw.githubusercontent.com/sub0xdai/vic-uni-capstone/master/docs/assets/media/image3.png)

**Finished when**, on `/preview`:

- Three tabs: Blog outline, Social caption, Email newsletter
- The selected tab is clearly highlighted
- A Topic field
- A Keywords area where words can be added and removed
- A Generate button
- While waiting, the button is greyed out and says so

### Draft editor and actions

The right half of the main screen.
The generated text appears here, and the user can change it, copy it and rate it.

**Where** `web/components/draft-editor.tsx`

**Picture** Look at the right column of the same screen.

![Content generator screen](https://raw.githubusercontent.com/sub0xdai/vic-uni-capstone/master/docs/assets/media/image3.png)

**Finished when**, on `/preview`:

- A box holding the generated text that the user can type into
- A Save button, greyed out until the text changes
- A Copy button that puts the text on the clipboard and confirms it
- Five stars that save when clicked

### Dashboard draft list

The list of everything the user has generated before.

**Where** `web/components/draft-list.tsx`

**Picture**

![Dashboard screen](https://raw.githubusercontent.com/sub0xdai/vic-uni-capstone/master/docs/assets/media/image8.png)

**Finished when**, on `/preview`:

- One row per draft, showing type, topic, date and stars
- A Delete button on each row
- With no drafts at all, a friendly message telling the user to generate something

### Content-type prompt templates

The instructions sent to the AI, one set per content type.
This card is writing, not programming.

**Where** `web/lib/prompts.ts`

**Finished when**

- Three templates written, one for each content type
- The system template mentions the business name, the tone and the audience
- The blog template asks for headings, an introduction, three to five sections and a conclusion
- The social template asks for under 280 characters and a call to action
- The email template asks for a subject line, preview text, a body and button text
- `pnpm test` passes, with the test marked skipped in `web/lib/prompts.test.ts` now unskipped

### Seed demo data

Example content so the dashboard is not empty during the demonstration.

**Where** `web/supabase/seed.sql`

**Finished when**

- The file contains a handful of example drafts, covering more than one content type
- It can be pasted into Supabase and run without an error

### Manual QA pass

Using the finished app and writing down everything wrong with it.
No programming.

**Where** `docs/qa/`

**Finished when**

- You have gone through the whole flow twice on the deployed site
- Every problem found is written down with a screenshot and the steps that reproduce it
- The list is dated

**QA** stands for quality assurance. It means testing, and writing down what broke.
