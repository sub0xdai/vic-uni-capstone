# Handoff: ContentCraft capstone, feedback cards and the tenancy proof

**Date:** 2026-11-03
**Project:** `~/1-projects/capstone` (vic-uni-capstone)
**Next focus:** run the F3 migration on the live project, merge PR #81, then deploy.

---

## Summary

The project is a Next.js 16 app on Supabase that writes marketing copy for small businesses, plus a proposal and design document set for NIT3003/NIT3004.
This session turned the instructor's five architectural recommendations into one written answer and four cards, built and merged two of them, and closed the last unverified claim in the report.
The database tenancy rules were tested on the real project and held, and a draft was generated and rated through the browser.
One card is open: token usage and cost, which needs a database migration before it can be merged safely.

---

## Current State

| What | Status |
|------|--------|
| `master` at `06bf0eb`, 76 tests, typecheck and lint clean | ✅ Done |
| Instructor feedback answered, F1 to F4 carded | ✅ Done (`3623eac`) |
| PII and secret scan before every commit | ✅ Done (`b19d9c4`) |
| F1, rating recomputes the stored quality score | ✅ Done (`e1d5d31`) |
| F2, model provider behind a configurable port | ✅ Done (`b686fc4`) |
| W3.4 closed, PR #72 rejected with reasons | ✅ Done (`6f21b6c`) |
| Tenancy verified on the live project | ✅ Done (`41a4657`) |
| Generation and rating exercised in the browser | ✅ Done (`06bf0eb`) |
| F3, token usage and cost | 🔄 PR #81 open, blocked on a migration |
| F4, prompt templates as data | ⬜ Not started, depends on G3 |
| G3, evaluation experiment | 🔴 Blocked, needs human raters and real drafts |
| Deployment and a public URL | 🔴 Blocked on owner credentials |
| Load test | 🔴 Blocked on the deployment |

---

## Key Decisions

- **The provider is configuration, not an import.** `lib/generator.ts` is the port and `lib/gemini.ts` is the only adapter. An unknown provider throws an invariant rather than returning a `Result`, because a wrong deployment variable has no recovery path at request time.
- **Failures are a closed set of four kinds** (`timeout`, `unreachable`, `upstream`, `unusable`) and the route owns the HTTP mapping, so an adapter never picks a status code.
- **Prompts stay in code for now.** Moving them to a table only pays once there is a metric to compare versions against, which is G3's job. Card F4 keeps the tests by linting each active template against the structures `evaluate.ts` scores.
- **Prompt shortening was declined.** Measured: 76-word system prompt and 47 to 60-word user prompt is about 190 input tokens against a 1024-token output cap, so a prompt 30% shorter saves under 5% of a call. The output cap and the 20-draft limit are what bound spend.
- **The isolation test is a query, not a look at the app.** Every page adds `.eq("user_id", ...)`, so a working filter hides a broken policy. The test reads with a user's token and no filter.
- **PR #72 was closed rather than merged.** It added a server route for a column that RLS already guards, creating a second write path for one field, and it would have re-frozen the satisfaction metric.
- **Prices live in a `model_rate` table.** A constant in a component would be wrong within a term and unarguable in a report. The seeded rate is a labelled placeholder.

---

## Artifacts

| Artifact | Path | Description |
|----------|------|-------------|
| Answer to feedback | `docs/design/response-to-feedback.md` | All five recommendations, each with the measurement that decides it |
| Board and plan | `docs/plan/build-plan.md` | F1 to F4, G3 restated, Done table reconciled with master |
| Tenancy evidence | `docs/plan/tenancy-check.md` | Checks, outputs, and what they do not cover |
| Architecture | `docs/design/architecture.md` | 3.7 updated to describe the port that now exists |
| Schema | `web/supabase/schema.sql` | Includes `model_rate` |
| Migration | `web/supabase/2026-11-03-usage-and-rates.sql` | Must run before F3 merges |
| Score model | `web/lib/evaluate.ts`, `web/lib/score.ts` | Five metrics, weights, threshold, `applyRating` |
| Usage and cost | `web/lib/usage.ts` | `monthlySpend`, `costOf`, `rateFor` |
| Open PR | https://github.com/sub0xdai/vic-uni-capstone/pull/81 | F3, token usage and cost |
| Working tree | clean, on branch `F3-token-usage` | `master` is untouched by the open PR |

---

## Suggested Skills

| Skill | Relevance | Invocation |
|-------|-----------|------------|
| `verify-ui` | The deployment is the next milestone, and any claim about the deployed app should come with a screenshot, console output and network calls | `/skill:verify-ui` |
| `benchmark-checklist` | The load test is carded and its numbers will be quoted in the report. Vet them before they are written down | `/skill:benchmark-checklist` |
| `correct` | Three mistakes have now repeated in this repo: a claim made before a run, a guard that silently passes, and invented numbers. Each could become a check | `/skill:correct` |

Also consider:

- **Read first**: `docs/design/response-to-feedback.md`, then `docs/plan/build-plan.md` for the F and G cards, then `web/lib/generator.ts` and `web/lib/evaluate.ts`.
- **Tests to run**: `cd web && pnpm check`, and `bash .githooks/pre-commit` after staging source files.
- **Git state**: clean. On `F3-token-usage`; `master` has no unmerged work from this session other than PR #81.

---

## Open Questions / Blockers

- **Run the F3 migration before merging #81.** Until `generated_content.usage` exists, every generation fails to save. The SQL is in `web/supabase/2026-11-03-usage-and-rates.sql`.
- **The seeded rate is a guess.** 0.10 and 0.40 per million tokens are placeholders for a model whose name is also a placeholder. Replace before quoting a cost.
- **`SUPABASE_SERVICE_ROLE_KEY` is empty** in `web/.env.local`, which silently breaks anything administrative. Either fill it or remove it from `.env.local.example`.
- **Two test accounts remain** in the live project from the tenancy check, with a profile each and one draft. Deleting them needs the service role key or the dashboard.
- **The hook exits 0 when `.venv` is missing**, so a clone that never ran `uv sync` commits unguarded with two printed lines to notice it. Decide whether that should block.
- **No deployment.** Nothing can be demonstrated to an assessor, and the load test cannot run.
- **G3 needs people.** The code is unblocked now that a rating moves the score, but the experiment needs real drafts and two or three raters.

---

## Redactions

| What | Why |
|------|-----|
| Test account addresses | The tenancy check created two accounts; they are described by kind rather than by address |
| Project reference and keys | Live Supabase credentials live in `web/.env.local`, which is not committed, and are not reproduced here |
