# LANDWATCH — Phase 0 decision record

The three Phase 0 deliverables from `engineeringplan.md §1`, their current state, and
the one decision that still needs a domain expert.

Everything downstream rests on this file. If the delay definition changes, every
prediction in the system changes with it.

---

## Decision 1 — Prototype domain

**Locked: National Highway land acquisition, under the National Highways Act, 1956.**

Not the RFCTLARR Act 2013 process, and not state-level acquisition.

Why:
- The NH process has six clearly-defined statutory stages (3A → 3C → 3D → 3G → 3H → 3E)
  with published timelines. State processes vary and are harder to model consistently.
- Bhoomi Rashi is mandated for all NH acquisition notifications, so the data has one
  structure rather than twenty-eight.
- NHAI publishes a target timeline per stage, which gives us a baseline to measure
  against. Nothing equivalent exists for the general RFCTLARR route.

Consequence: every claim the system makes is scoped to NH acquisition. It should not
be presented as general-purpose land-acquisition software.

---

## Decision 2 — Stage baselines

**Adopted: NHAI Circular No. 7.1.83/2025, dated 9 April 2025.**

The circular publishes an eight-stage timeline totalling 336 days, of which 306 days
run to possession. Mapped onto the six sections we track:

| Stage | Days | Basis |
|---|---|---|
| 3A | 21 | Draft submission + publication (circular stages 1–2) |
| 3C | 21 | Objection period fixed by s.3C, NH Act 1956 |
| 3D | 69 | Balance of the 90-day 3A→3D window (circular stage 3) |
| 3G | 95 | Award declaration 90 + verification 5 (circular stages 4–5) |
| 3H | 10 | Fund deposit and disbursement (circular stage 6) |
| 3E | 90 | Possession notice and ROW mobilisation (circular stage 7) |
| | **306** | **Total to possession — reconciles with the circular** |

Where the circular gives a range we take the longer figure (90 days for
Cabinet-approval cases, 90 for possession). A baseline that is too tight would flag
ordinary projects as delayed.

**This replaced invented numbers.** An earlier version used 60/90/120/90/60/45,
totalling 465 days — chosen because they looked plausible. They were not sourced from
anything. Every "days behind baseline" figure on the card derived from them.

Recorded in `app/stages.py`, which is the single source. It was previously duplicated
in four files that agreed only by luck.

---

## Decision 3 — Data sources

**Complete. See `datasources.md`.**

Summary of what that register found: the process *features* are obtainable. The
*outcome labels* are not, from any source we could confirm access to. That is the
project's central constraint and it is a data problem, not a modelling one.

---

## OPEN — the delay-label definition

**This is the decision that needs a domain expert. It is the only Phase 0 item still
outstanding, and it is the most consequential one in the project.**

### What we currently use

```python
# ml/delay_label.py
DELAY_THRESHOLD = 1.5
delayed = actual_elapsed_days > 1.5 * expected_total_days(current_stage)
```

A project counts as delayed once it exceeds 1.5× the NHAI target for the stages it
has reached. At stage 3G that means 314 days against a 206-day target.

### Why this choice, and why it may be wrong

We chose the statutory baseline because it is the only definition computable without
historical outcome data, which we do not have. But it inherits a real weakness:

**NHAI's timeline is a target, not observed practice.** If real NH acquisitions
routinely take two or three times the published target — which anecdotally they do —
then a 1.5× threshold would classify the large majority of projects as delayed. A
model whose target is "almost everything" is not useful for prioritisation, which is
the entire point of the product.

We cannot check this. It needs someone who knows what actual durations look like.

### The three options

| Option | Definition | Needs | Risk |
|---|---|---|---|
| **A. Statutory baseline** *(current)* | Exceeds 1.5× the NHAI target | Nothing — works today | Target may be unrealistic, so nearly everything reads delayed |
| **B. Historical baseline** | Exceeds 1.5× the *observed median* for comparable projects | A sample of real durations | More honest, but we have no such sample |
| **C. Severity bands** | Multi-class: on-time / moderate / severe | Agreed band boundaries | Richer output, but needs more labelled data than a binary target |

### What we need from the mentor

1. **Is 1.5× the statutory target a defensible definition of "significantly delayed"
   for NH acquisition?** If not, what would be — 2×? 3×? A fixed number of days?
2. **What does a normal NH acquisition actually take, end to end?** Even a rough
   figure would tell us whether Option A is usable or misleading.
3. **Is NHAI's published timeline used in practice as a performance measure**, or is it
   aspirational? This decides whether "behind baseline" means anything to an officer.
4. **Would an NHAI target-vs-actual proxy label be acceptable** for an SIH prototype,
   if we can scrape a small real sample?
5. **What sample size would count as credible** — 50 projects? 500?

### Until it is answered

- `ml/delay_label.py` carries `PROVISIONAL` at the top and holds the threshold in one
  place, so changing it is a one-line edit followed by a retrain.
- Every screen states that the system is trained on synthetic data.
- No claim is made about real-world accuracy anywhere in the product or the pitch.

---

## Phase 0 status

| Deliverable | State |
|---|---|
| Prototype domain locked | Done — NH acquisition, NH Act 1956 |
| Stage baselines sourced | Done — NHAI Circular 7.1.83/2025 |
| Data-source register | Done — `datasources.md` |
| Delay-label definition agreed | **Open — needs domain sign-off** |

Three of four. The fourth cannot be closed by the team alone, and pretending otherwise
would be the least defensible thing in the project.
