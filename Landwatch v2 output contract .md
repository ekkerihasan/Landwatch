# LANDWATCH — output contract

The target output for a single project:

```
Project: Hubballi–Dharwad Highway Expansion
Overall delay risk: 82% — High
Predicted delay: 94 days
Top risk factors:
1. Compensation pending for 38% of affected families.
2. Three unresolved legal disputes.
3. Approval stage already 24 days behind baseline.
4. Rehabilitation plan progress below 50%.
Recommended actions:
- Prioritize compensation verification.
- Escalate unresolved cases to the legal cell.
- Assign an additional field officer.
- Schedule a district-level review within seven days.
```

Every line of that card is a dataset requirement. This file works backwards from the card.

---

## Line-by-line trace

| Card element | What produces it | Status |
|---|---|---|
| `82% — High` | continuous `delay_risk_score` + thresholded class | planned (task 5) |
| `Predicted delay: 94 days` | **regression target + a second model** | **not in the plan — new work** |
| `Compensation pending for 38%` | `compensation_disbursement_pct`, reported as `100 − value` | task 3 (currently maxes ~33%, unusable) |
| `Three unresolved legal disputes` | `active_litigation_count` | exists |
| `Approval stage 24 days behind baseline` | `stage_days_vs_baseline` = `stage_days − BASE[stage]` | **new derived field** |
| `Rehabilitation plan progress below 50%` | `rehabilitation_progress_pct` | **check — likely absent from schema** |
| ranking of the four factors | per-row SHAP, top-k | task 8, extended |
| the four recommendations | deterministic rule catalogue, not a model | **new, non-ML** |

---

## Gap 1 — the card is a regression problem wearing a classifier's clothes

`Predicted delay: 94 days` is not something a Low/Medium/High/Critical classifier can emit.
It needs its own target column and its own model.

Add to the outcome table:
- `delay_days` = `actual_duration − budgeted_duration` (the ground truth overrun)
- at snapshot level, `remaining_delay_days` = the overrun still to come as of that snapshot,
  since the card is shown mid-project, not at completion

Then train a regressor alongside the classifier. Keep them consistent: the class should be a
thresholded view of the score, and the score should be monotonic in predicted delay days.
Two models that disagree — 82% High but 6 days predicted delay — destroy the card's credibility
instantly.

**Censoring problem:** projects that hit `MAX_DAYS` have no observed final duration, so they have
no `delay_days`. They cannot be dropped (they are the worst cases, dropping them biases the
regressor optimistic) and they cannot be given a made-up value. Either exclude them from
regression training and say so explicitly, or use a survival model. Decide before building the
regressor, not after.

## Gap 2 — SHAP picks the factor, the raw feature supplies the number

The card says *"pending for 38%"*, not *"compensation contributed 0.14 to the score"*. So the
factor layer needs both:

- **SHAP** to decide *which* four factors to show and in what order
- **the raw snapshot feature value** to fill in the number

This means every feature that can appear on the card needs a phrasing template, so the wording
is deterministic and no LLM is needed at inference:

```
compensation_disbursement_pct  → "Compensation pending for {100-v:.0f}% of affected families."
active_litigation_count        → "{v} unresolved legal dispute(s)."
stage_days_vs_baseline         → "{stage} stage already {v} days behind baseline."
rehabilitation_progress_pct    → "Rehabilitation plan progress below {threshold}%."
```

Store these in one config file, not scattered through the UI code.

## Gap 3 — recommendations are rules, not model output

Nothing in the dataset predicts "assign an additional field officer." That is a lookup from the
top factor to an action. Build an explicit catalogue:

```
compensation_disbursement_pct low  → prioritize compensation verification
active_litigation_count high       → escalate to legal cell
stage_days_vs_baseline high        → assign additional field officer
any two factors High+              → schedule district-level review within seven days
```

Keep it in a config file that a domain reviewer can read and argue with. This is a strength, not
a weakness — being able to say "the recommendation layer is deterministic and auditable, the
prediction layer is learned" is a cleaner story than "the model recommends things."

---

## One honesty problem to fix before anyone sees this card

`Predicted delay: 94 days` is a point estimate to the day, produced by a model trained on
synthetic data. The first person who asks "94 based on what?" is asking the right question, and
"our simulator generated it" is not an answer that survives.

Show a range instead: **"Predicted delay: 80–110 days"**, from the regressor's prediction interval.
It is more defensible, it is more honest about what synthetic training data can support, and it
costs nothing to implement — quantile regression or a bootstrapped interval.

Same applies to `82%`. If the model is not calibrated, that number is a score, not a probability,
and it should not carry a `%` sign. Either run calibration and be able to show a reliability
curve, or label it "Risk score: 82 / 100".

---

## Added tasks

| # | Task | Depends on |
|---|------|-----------|
| 9 | Add `delay_days` and `remaining_delay_days` targets; decide censoring handling | tasks 2, 5 |
| 10 | Add `stage_days_vs_baseline` and `rehabilitation_progress_pct` to the schema | task 4 |
| 11 | Train the delay regressor with prediction intervals; enforce consistency with the classifier | tasks 8, 9 |
| 12 | Factor-phrasing config + recommendation rule catalogue | task 11 |
| 13 | End-to-end card renderer: one project in, the card above out | all |

---

## Claude Code prompt for the next session

> Read `LANDWATCH_V2_OUTPUT_CONTRACT.md`. The dashboard card in it is the required output shape.
> Audit the current schema and tell me, field by field, which card elements can already be
> produced, which need new columns, and which need a model that doesn't exist yet. Do not start
> implementing — I want the gap list first, with the actual current column names, not assumptions.