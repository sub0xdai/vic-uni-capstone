# Polish first, then additions

Seven cards in two groups.
The first group fixes what the app already promises and does not deliver.
The second group adds the missing workflow once the first group is on a screen and has been used.

Source: a read-only study of Postiz v1.47.0 (`gitroomhq/postiz-app`, `bd8353f`), recorded in this document as concepts only.
No Postiz source, markup, styling or naming is copied.
Postiz is AGPL-3.0 and this repository has no licence file, so reimplementation is the only safe route.

This document is the plan of record for these seven cards.
The board cards are created from the sections below, the same way `build-plan.md` feeds the GitHub board.

| ID | Card | Group | Effort | Depends on | Who |
|---|---|---|---|---|---|
| P0.1 | Rescore the draft when the text is saved | Polish | S | none | Daniel |
| P0.2 | Show the format budget while typing | Polish | S | none | delegable |
| P0.3 | Filter and count drafts by status | Polish | S | none | delegable |
| P0.4 | Reuse a draft's inputs in the generator | Polish | S | none | delegable |
| P1.1 | A draft detail route | Addition | M | P0.1, P0.3 | Daniel |
| P1.2 | A format preview beside the editor | Addition | M | P0.2, P1.1 | delegable |
| P1.3 | Say which check failed, and where | Addition | M | P0.1, P1.2 | Daniel |

Effort: **S** is one file plus one test, under an hour.
**M** is a route or a component with real edge cases, about half a day.
Nothing here needs a schema change, a new dependency, or a new API route.

## Why this order

The app generates content well and then stops.
A saved draft cannot be reopened, its score stops matching its text the moment the owner edits it, and the list of drafts answers no question the owner asks.

Adding a preview or a detail page on top of a stale score would present a wrong number more prominently.
That is why the rescore is first, and why the detail page waits for it.

---

## P0.1 Rescore the draft when the text is saved

**Problem.** Saving an edit writes `content_text` only (`web/app/generate/page.tsx:149-152`).
The stored `analysis` keeps describing the words the user just replaced.
Every surface that reads it is then wrong: the quality card, the average score on the dashboard, the favourites line, and any sample G3 collects.

**Behaviour.** Saving text recomputes the report with the same scorer that generated it, keeps the existing rating, and writes both columns in one update.
If evaluation fails, the text is still saved, the previous report is left alone, and the page says the score could not be updated.

**Where.**
`web/lib/evaluate.ts` gains `rescoreText`, beside `applyRating`, so the scoring rules stay in one module.
`web/app/generate/page.tsx` and, later, the detail page call it.
No new API route: the browser already writes these columns under row level security, and a second write path for one field is the mistake pull request #72 was closed for.

**Data.** No schema change.
One `.update({ content_text, analysis })` instead of `.update({ content_text })`.

**Finished when.**
A caption edited from 200 to 400 characters drops `structureScore` to 0.5 and its `overallScore` falls.
The rating is unchanged after the save.
Reloading the page shows the new score.
A test feeds a draft with a rating into `rescoreText` and asserts the satisfaction metric survives.
An evaluation failure still saves the text and surfaces a message.

**Notes.** `rescoreText` needs the profile's `brandTone`, which is not on the draft.
Both call sites already load the profile for other reasons, so it is passed in rather than looked up inside the scorer.

---

## P0.2 Show the format budget while typing

**Problem.** The owner learns that a caption is 340 characters from a percentage after generating, never while writing.
The scorer knows the limit already (`web/lib/evaluate.ts:129-132`), and so does the prompt, which repeats the number as prose (`web/lib/prompts.ts:27-32`).

**Behaviour.**
Under the textarea, one advisory line that depends on the content type: a caption shows `212 / 280` and turns the overflow red; an email shows three badges for Subject, Preview and Button that light as each appears; an outline shows how many headings were detected against the three to five the scorer wants.
Advisory, never a block: the owner can still save an over-length caption, and P0.1 then scores it honestly.

**Where.**
`web/lib/evaluate.ts`: the structure checks become named checks that report a pass and a reason, with `structureScore` computed from them. No behaviour change to the score.
`web/lib/types.ts`: one exported limit constant for the caption, so the scorer, the prompt hint and the editor read the same number.
`web/lib/prompts.ts`: the structure hint for a caption is built from that constant instead of repeating `280` as text.
`web/components/draft-editor.tsx`: the counters.
`web/app/preview/page.tsx`: the editor entry gains an over-length sample, since a change nobody can see on `/preview` cannot be reviewed.

**Data.** None.

**Finished when.**
Typing past the limit shows the counter over budget in red on `/preview`.
Removing the `Button:` line from an email draft turns that badge off.
The badges agree with `structureScore` on the same text, asserted by one test per content type.
Changing the limit constant changes the prompt hint and the lint together.

---

## P0.3 Filter and count drafts by status

**Problem.** Every draft renders in one list, newest first, with no counts and no filter (`web/app/dashboard/page.tsx:341-348`).
Discarded content sits between live drafts and the owner cannot answer "what have I published?".

**Behaviour.**
Four chips, `All`, `Drafts`, `Ready`, `Discarded`, each showing its count, defaulting to All.
Filtering happens on the already-loaded array, because the monthly limit bounds it at twenty.
The published action and badge read `Mark ready` and `Ready`, because the app marks content for use and distributes nothing.
The stored status stays `published`, so no data moves and no migration is needed.

**Where.**
`web/app/dashboard/page.tsx` holds the selected status and the counts.
`web/components/draft-list.tsx` renders the chips and distinguishes "no drafts at all" from "none in this filter".
`web/lib/types.ts` changes the one label map every screen reads.

**Data.** None.

**Finished when.**
Choosing Ready shows only rows marked ready, and the count on the chip equals the rows shown.
The badge, the button and the chip all read Ready, while the stored value is still `published` and the existing rows still load.
Choosing a status with no matches shows a message that offers a way back to All.
The empty state with zero drafts still invites the owner to generate one.

---

## P0.4 Reuse a draft's inputs in the generator

**Problem.** Running the same campaign in a second format means retyping the topic and the keywords, and the generator keeps no memory of the last request.

**Behaviour.**
A `Reuse` action on a draft row opens the generator with that draft's content type, topic and keywords filled in.
It never calls the model, so it spends nothing from the monthly limit.

**Where.**
`web/components/draft-list.tsx` adds the action.
`web/app/generate/page.tsx` reads the values from the query string on first render and leaves the form alone afterwards.

**Data.** None.

**Finished when.**
Reuse on a published email draft opens the generator with the email tab active, the topic filled and the keyword chips present.
Pressing Generate creates a new row and leaves the original draft untouched.
Opening `/generate` with no query string behaves exactly as it does today.

---

## P1.1 A draft detail route

**Problem.** The hole in the product.
A saved draft can never be read again.
`/generate` renders only the draft from the last POST response (`web/app/generate/page.tsx:82`), and the dashboard list shows topics without content (`web/components/draft-list.tsx:55-58`).
Reading, editing, copying or rating an older draft is impossible.

**Behaviour.**
`/draft/[id]` loads one row and renders the existing editor and quality card side by side, with the status actions, the copy action, and the prompt that produced it (`system_prompt`, `user_prompt`, `prompt_version` are already stored on the row).
Dashboard rows link here.
A draft that is not the caller's renders the same not-found state as one that does not exist.

**Where.**
New `web/app/draft/[id]/page.tsx`.
`web/components/draft-list.tsx`: the topic becomes a link.
`web/proxy.ts`: `/draft` joins the guarded prefixes.
`web/app/preview/page.tsx`: the composition gets a gallery entry.

**Data.** None. One select by id, already covered by the existing policy.

**Finished when.**
After a full page reload, opening a draft shows its text, score, rating and prompt version.
Editing and saving there updates the score through P0.1 and the dashboard reflects it on the next load.
Another account's draft id renders not found.
Signed out, `/draft/<id>` redirects to the login page.

---

## P1.2 A format preview beside the editor

**Problem.** One textarea serves three formats.
An email that came back with `Subject:`, `Preview:` and `Button:` is unreadable as a wall of text, and an outline is judged by its structure while being edited as prose.

**Behaviour.**
A read-only panel next to the editor, chosen by content type. A caption renders as a card with the budget gauge and the call to action marked. An email renders as labelled Subject, Preview, Body and Button blocks. An outline renders as a heading list with the introduction and conclusion marked. Anything that the scorer looks for and is missing is flagged in place.

**Where.**
New `web/components/draft-preview.tsx`, used by the detail page first, then by `/generate`.
The parsers live in `web/lib/` beside the scorer's checks so the preview and the score cannot disagree.
The gallery shows all three formats on `/preview`.

**Data.** None.

**Finished when.**
An email draft renders four labelled blocks.
A caption over the limit shows the overflow flagged.
A draft with no labels at all renders as plain text and does not raise.

---

## P1.3 Say which check failed, and where

**Problem.** Structure is reported as a fraction.
"Structure 66%" tells the owner nothing to change, and it is the number G3 has to explain in the report.

**Behaviour.**
Each structure check reports a reason and the span of text it applies to.
The quality card lists the reasons, and the preview marks the span. A caption with no call to action says so, and the same caption scores 0.5 for structure.

**Where.**
`web/lib/evaluate.ts` for the reasons, `web/components/quality-card.tsx` for the list, `web/components/draft-preview.tsx` for the marks.
`web/lib/rows.ts` reads the reasons back, tolerating rows written before this card, since `analysis` is stored as JSON.

**Data.** None, and that is a change from the first draft of this card.
The reasons are derived from the stored text when the report is rendered, with the same rules that produced the score.
Storing them would duplicate a value the text already decides, and a report written before this card would then show a score with no reasons next to it.
Derived means every stored draft gains the reasons with no migration and no back-compat branch.

**Finished when.**
A caption with no call to action lists the reason and scores 0.5 for structure.
The reason survives a reload.
A report stored before this change still parses and still displays.

---

## Sequence and review gates

1. **P0.1.** One function and one call site. Nobody should build on the score until this lands.
2. **P0.3** and **P0.4** in either order, or in parallel by two people. Neither touches the scorer.
3. **P0.2.** Touches the scorer's checks, so it goes after P0.1 to keep one change per review.
4. **Stop.** Run the app, use all four on real drafts, and fix what is annoying before starting P1.
5. **P1.1.** Depends on P0.1 for a fresh score and P0.3 for the row link.
6. **P1.2.** Depends on P0.2 for the checks and P1.1 for where it renders.
7. **P1.3.** Last, because it changes the report contract. Depends on P0.1 and P1.2.

Every card ends with `pnpm check` and `pnpm build` green in `web/`, one test for anything that touches data, and a visible entry on `/preview`.

## What this plan does not include

- **Scheduling and a calendar.** There is no publish target, so a calendar would schedule nothing.
- **Platform integrations.** OAuth per platform, token storage and retries are outside the unit.
- **Per-post analytics.** Needs each platform's API. The measurable story here is G3, which is local.
- **Share links and reviewer comments.** A public surface and a token model for a product with one user.
- **A per-draft tone override.** The tone lives in the system prompt and the prompt is versioned; adding a second source for it would complicate the lint for no measurable gain.
- **Rich text editing.** The scorer and the prompt both assume plain text.

## Risks

- **The score is now written from two places.** P0.1 keeps both writes behind one pure function, and `applyRating` stays the only thing that changes satisfaction, so a rating and a rescore cannot diverge.
- **P0.2 changes the scorer's internals.** The score must stay identical for the same text, asserted by keeping the existing structure tests and adding the reason assertions beside them.
- **G3 samples must be collected after P0.1.** Today G3 is testing only, so nothing is lost, but a sample taken from stale scores would have to be thrown away.
- **The `/preview` rule is the review mechanism.** P0.2, P0.3, P1.1 and P1.2 each need a gallery entry, or nobody else on the team can review them.
- **The word Published disappears from the UI but not from the data.** The proposal sections still describe publishing as the final step, so the report keeps the word while the app says Mark ready. The enum value `published` is unchanged and no migration is needed.

## Licensing

Postiz is AGPL-3.0 (`LICENSE:1-2` in that repository).
This repository has no licence file.
No Postiz source, component, class string or asset is reused here.
The cards above describe behaviour and workflow, and each one names a ContentCraft file where an independent implementation belongs.
