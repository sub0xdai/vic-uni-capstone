# Review notes

Findings from the proposal review on 15 March 2026 and the audit that followed on 2 October 2026.

Two things prompted this.
The reviewer's feedback was that the proposal read as a functional description of an LLM tool rather than a structured product design, and that the system architecture and the evaluation approach were not convincing.
Separately, no marking rubric is published anywhere on the unit site or in the available files, so the criteria used here are the ten session guidance notes, each of which ends with an explicit checklist addressed to the team.

Everything below is a finding, not a task.
Tasks live in `docs/plan/build-plan.md`.

---

## 1. Timeline

The implementation gate is 80 percent complete before the second unit starts, with a demonstration in its first week.
The team's own Gantt put implementation completion at 15 October 2026.

On 2 October 2026 the repository contained no application code.
`1-projects/capstone` held documents only, and its git history was four commits, all documentation.

NIT3003 finished on 12 March 2026.
That is approximately seven months between the end of the design phase and the audit.

## 2. An assessed deliverable does not exist

The unit brief states that a progress diary must be maintained from the end of NIT3003 until the second unit begins, updated after each weekly session, and that it is assessed in the second unit.
The brief also requires team meetings at least once a week over the same period.

No diary and no meeting record existed.
The team's own Gantt scheduled the diary as a six day task starting 2 November, which is the week the second unit begins.
That is a record written after the fact rather than maintained during it.

## 3. Requirements are not traceable

| Expected | Actual |
|---|---|
| Unique identifiers such as `FR-01` on every functional requirement | None. One dangling reference to `NFR-05` appears twice in the UI section and is never defined |
| MoSCoW prioritisation | Absent |
| A non-functional requirements table with a how-to-measure column and a justification column | Prose sections only, neither column present |
| Use case identifiers and exception flows | Four use cases with pre and post conditions, no identifiers, no exception flows, one alternative flow |
| A risk register with likelihood, impact and an owner per risk | Prose covering about five risks, no table, no owners |
| Task dependencies in the timeline | Three Gantt charts with owners and dates, no dependencies marked |

Without identifiers, nothing downstream can reference a requirement.
The risk register and the timeline cannot cite the requirement they exist to protect.

## 4. Missing sections

- **Competitor analysis.** Two named tools appear in a single sentence. The exemplar proposals both carry a dedicated section with strengths, weaknesses and a comparison table.
- **Acceptance criteria.** None exist, for any feature.
- **Test plan.** None exists. The non-functional requirements demand a measurement method, which cannot be written without one.
- **Hardware resources.** The resource plan lists software and personnel only.
- **Skills matrix and skill gaps.** The checklist asks for both. Neither is present.

## 5. The evaluation approach is asserted, not validated

This is the reviewer's central criticism and the audit supports it.

- The five metric weights and the 0.6 regeneration threshold are stated but not derived from anything.
- There is no labelled set, no baseline and no comparison against human judgement, so no claim about the rubric's accuracy can be made.
- User satisfaction carries the heaviest weight at 0.35 and is computed from past star ratings on content the same scoring loop produced. The loop feeds itself, and below three ratings it defaults to a hard-coded 0.7 which is then weighted most heavily.
- Readability is measured from average sentence length and average word length. The proposal cites Flesch Reading Ease, whose actual formula depends on syllables. The cited metric is not the implemented one.
- Tone alignment matches against a hardcoded marker list. The list given for the professional tone includes `furthermore` and `moreover`, which the project's own house style bans.
- Keyword coverage is raw substring presence, with no stemming and no penalty for repetition, so it rewards stuffing.
- Structural compliance is length thresholds and heading counts.
- Nothing assesses factual accuracy at any point, although hallucination is named as the top risk.
- The architecture named a third party scoring vendor. The pseudocode scores locally with string matching. The vendor was asserted and never implemented.

## 6. Architecture was internally inconsistent

The sequence diagram showed the browser reading the brand profile from the database directly, while the pseudocode placed prompt assembly on the server.
It was therefore unclear which component was authoritative for the prompt, and the trust boundary was undefined.

Correction recorded in `docs/sections/05-sequence-diagrams.md` and `docs/design/architecture.md`.
The server owns all data access and the browser does not communicate with the database.

## 7. Non-functional requirements are not supported by the design

The targets of 99.9 percent uptime during business hours, 50 concurrent users, a queue above 100 requests per minute, and generation within 15 and 45 seconds are all stated as requirements.
No component in the design provides them, and no measurement plan exists.

A single free-tier serverless deployment does not provide 99.9 percent availability.
Verification is also required for the claim that passwords are hashed with bcrypt and that row-level security prevents cross-tenant access, since neither was tested.

## 8. Administrative inconsistencies

- The allocation sheet lists three students for this project. The proposal names four, and two student identifiers on the title page do not appear in the sheet at all. Worth confirming with the supervisor before the contribution table is finalised.
- The unit brief and the session notes call the second unit NIT3004. The proposal calls it NIT4001 throughout, including in its Gantt charts.

## 9. What the review did not find

Recorded so the audit is not read as uniformly negative.

- The problem statement and the justification for the project are sound and cited.
- The aims and objectives are specific and measurable.
- The pseudocode is genuinely detailed and covers authentication, generation, evaluation and review.
- The three Figma mockups represent real design work and follow a consistent design system.
- The database schema, once written, is more careful than most prototypes: it enforces tenancy with row-level security on all four operations, including a `with check` clause on insert.
