# The evaluation experiment

Card `G3`.
This document is the experiment, written before the result so the result cannot be chosen after it.

The question it answers is the one the 15 March review left open: the five metric weights and the 0.6 threshold were asserted, not validated.
This document turns that assertion into a measurement with a decision rule attached.

---

## 1. The question

Does the automated score agree with a person who reads the same draft and was not told the score?

Two numbers answer it.

- **Rank correlation** between each computed metric and the human rating. If a metric does not move with human judgement, it is not measuring quality.
- **Agreement at the threshold** between "the machine passes this draft" and "a person would use this draft". If the two disagree more than chance allows, the threshold does not separate usable drafts from unusable ones.

The experiment then names the weakest metric, and measures exactly one change against the sample.

---

## 2. The sample

Every draft the team has generated on the shared project so far, with its stored analysis.
No selection, no removal of bad drafts, because a sample chosen after seeing the scores is not a sample.

Export it from the Supabase SQL editor, which runs as the project owner and is therefore not subject to row level security:

```sql
copy (
  select id,
         content_type,
         coalesce(rating::text, '')                    as owner_rating,
         ''                                            as rater_rating,
         round((analysis->>'overallScore')::numeric, 4)     as machine_overall,
         round((analysis->>'readabilityScore')::numeric, 4) as readability,
         round((analysis->>'toneScore')::numeric, 4)        as tone,
         round((analysis->>'keywordScore')::numeric, 4)     as keyword,
         round((analysis->>'structureScore')::numeric, 4)   as structure
  from generated_content
  where analysis is not null
  order by created_at
) to stdout with (format csv, header true);
```

`rater_rating` is left empty on purpose. It is filled in by a person who has not seen any number in the other columns.

Minimum useful size: ten drafts per content type, so thirty in total.
Below twenty the tool prints a warning, because rank correlation on a handful of drafts is a hint rather than a result.
The monthly limit is twenty drafts per user, so the sample grows with each person who uses the app, not with patience.

---

## 3. The raters

- At least two people who did not build the system, ideally one who works in marketing and one who does not.
- They see the draft text and the brief it was written for: the content type, the topic and the keywords. They do not see the score, the model or each other's ratings.
- They give one overall rating from 1 to 5, with the anchors below. A rating of 4 or 5 means "I would use this or something close to it".
- Ratings are recorded as a second CSV column per rater, so the analysis can be repeated per rater and the agreement between raters can be reported.

Anchors, printed on the sheet they are given:

| Rating | Meaning |
|---|---|
| 5 | I would use this as it is |
| 4 | I would use this after a small edit |
| 3 | The shape is right, the words are not |
| 2 | I would have to rewrite most of it |
| 1 | I would not send this, and it misses the brief |

The owner's star rating already in the database is **not** a substitute for this.
It is the opinion of the person who asked for the draft, given after seeing the score, and the score contains 35 percent of that rating.
It is kept in the export for comparison only.

---

## 4. The measures

**Rank correlation (Spearman) per metric.**
Computed against the rater's overall rating, for the four metrics the system calculates: readability, tone, keyword and structure.

`satisfaction` is excluded from this part on purpose.
It is not a prediction of quality; it is a human rating that the system stores and then partly reproduces.
Correlating it with another human rating would measure agreement between two people, not the validity of a metric, and it would inflate the overall number.

**Agreement at the threshold (Cohen's kappa).**
Machine pass means the stored overall score is at or above 0.6.
Human pass means the rater gave 4 or 5.
Kappa is reported rather than raw agreement, because raw agreement rewards a threshold that passes everything.

**The weakest metric.**
The lowest correlation of the four. This is the sentence the report needs: which part of the rubric is least connected to human judgement, with the number attached.

**One change.**
One weight set or one prompt version, chosen after seeing the weakest metric, measured against the same sample.
A weight change can be measured without generating anything, because the stored metrics are still the stored metrics, which is what the tool's `-weights` flag does.
A prompt change needs new drafts from the changed prompt, which is a second, smaller sample and a second column in the results.

---

## 5. Decision rules, fixed in advance

Written now so the plan cannot bend to the numbers later.

| Result | Decision |
|---|---|
| Correlation below 0.3 for a metric | That metric is not measuring what its name claims. Say so, and name it as a limitation of the scoring model |
| Correlation below 0 for a metric | Worse than noise. Reweight it to zero or remove it, and record which one was changed |
| Kappa below 0.2 | The threshold does not separate usable drafts. Either the threshold or the rubric changes, and the report says which |
| Kappa between 0.2 and 0.6 | Partial agreement. Report it as partial, with the weakest metric, and do not claim the threshold is validated |
| Kappa above 0.6 | The threshold separates usable drafts in this sample. Still report the sample size and the single-rater limit |

Exactly one change is made in response, then the second sample is measured.
Two changes at once would leave the report unable to say which one moved the number.

---

## 6. Running it

The tool is `tools/evaluation`, Go, standard library only.

```bash
cd tools/evaluation
go test ./...                                            # 8 checks on the maths and the parser
go run . -csv=/path/to/sample.csv                        # the sample as it stands
go run . -csv=/path/to/sample.csv \
  -weights=0.1,0.2,0.2,0.15,0.35                          # the same sample under a candidate weight set
```

The weight order is readability, tone, keyword, structure, satisfaction, matching `QUALITY_WEIGHTS` in `web/lib/types.ts`.
The tool refuses weights that do not total 1, and it refuses a row with a rating outside 1 to 5 or a metric outside 0 to 1, because a mistyped CSV should fail rather than produce a plausible number.

The threshold defaults to 0.6, the same constant the app uses.

A worked example on six synthetic drafts, where keyword coverage was deliberately built to move against the rater:

```
  rank correlation with the independent rater
      readability  +0.986
      tone         +1.000
    < keyword      -0.899
      structure    +1.000

  pass at the threshold
    machine pass 3, rater pass 3, both 3
    kappa +1.000

  warning: 6 drafts is a small sample; treat every number above as a hint
  warning: the weakest metric moves against the rater, which is worse than noise
```

The point of that output is the warning line: the tool says out loud when a metric runs backwards, which is the finding a report has to act on.

---

## 7. Results

To be filled in when the sample has been rated.
Two tables, and one sentence per row that the report can quote.

**Per metric, against the independent rater.**

| Metric | Weight | Spearman | Verdict |
|---|---|---|---|
| readability | 0.10 | | |
| tone | 0.20 | | |
| keyword | 0.20 | | |
| structure | 0.15 | | |
| satisfaction | 0.35 | excluded | a human input, not a prediction |

**Agreement at 0.6.**

| Measure | Value |
|---|---|
| Drafts in sample | |
| Machine pass | |
| Rater pass | |
| Both | |
| Cohen's kappa | |

**The change.**

| Field | Value |
|---|---|
| Weakest metric, evidenced | |
| The change made | |
| Kappa before | |
| Kappa after | |
| Decision this supports | |

---

## 8. What this experiment cannot show

- It is one sample from one shared project, with a few drafts per content type. It can find a metric that is broken. It cannot prove a metric is good.
- Two raters give a second opinion, not a ground truth. Inter-rater agreement is reported next to kappa so a low kappa can be read as "the rubric is wrong" or "the raters disagreed".
- Topic confounds everything. Two drafts written about different subjects differ in readability for reasons that have nothing to do with the prompt, which is why the sample is reported per content type and why the report does not compare prompt versions by score alone.
- The stored overall score includes the owner's own rating at 35 percent, so any agreement between the score and the owner is partly built in. That is why the rater has to be somebody else.
- One weight change measured once is evidence, not optimisation. It is enough to defend a rubric; it is not enough to tune one.
