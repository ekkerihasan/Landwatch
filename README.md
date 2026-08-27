# LANDWATCH — भूमि प्रहरी

**Predictive analytics for early detection of land acquisition delays.**
Smart India Hackathon problem statement **SIH26017**.

LANDWATCH is a decision-support layer that sits on top of existing land-acquisition
workflow systems. It reads project and process data, estimates the risk that a
National Highway acquisition will face significant delay, explains the estimate with
SHAP, maps each condition to an administrative action, and lets an officer test an
intervention before committing to it.

It recommends. The officer decides.

> ### Read this before demonstrating it
>
> **Every project in this system is synthetic, and the model is trained on synthetic
> data.** The metrics below show that the pipeline works end to end. They are *not*
> evidence that the system predicts real delays. No validated labelled dataset of
> Indian NH acquisition outcomes was available — every source checked is documented in
> [`datasources.md`](datasources.md).
>
> This is a prototype. It is **not** an official Government of India application.

---

## Contents

- [What it does](#what-it-does)
- [Quick start](#quick-start)
- [Architecture](#architecture)
- [API reference](#api-reference)
- [The machine learning](#the-machine-learning)
- [Project layout](#project-layout)
- [Common tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)
- [Known limitations](#known-limitations)
- [Documentation index](#documentation-index)

---

## What it does

Four things, in the order an officer needs them.

| | | |
|---|---|---|
| **1** | **Rank the caseload** | Every project scored Low → Critical, worst first, so limited attention goes where it changes an outcome |
| **2** | **Show the reasoning** | No score appears without the SHAP factors behind it, phrased in plain language |
| **3** | **Recommend the response** | Each condition maps to an action with a named owner — from a rule catalogue, not the model |
| **4** | **Test the intervention** | Move compensation or clear a case in the simulator and watch the score respond |

The output for a single project:

```
NH-48 Rajmarg Extension — Surat Corridor
Overall delay risk: 99% — Critical
Predicted delay: 211–812 days

Top risk factors
  1. 4 unresolved legal disputes.
  2. 3G stage is at 3.4x its expected duration.
  3. Compensation pending for 59% of affected families.
  4. Rehabilitation plan progress below 50% (at 34%).

Recommended actions
  • Prioritise compensation verification        Competent Authority (LA)
  • Escalate unresolved cases to the legal cell  Legal cell
  • Schedule a district-level review in 7 days   District Collector
  • Assign an additional field officer           Nodal officer
```

The split matters and is worth stating out loud: **the prediction layer is learned and
probabilistic; the recommendation layer is a deterministic rule table** a domain
reviewer can read and argue with, in [`app/factor_config.py`](app/factor_config.py).
No model invented "escalate to the legal cell".

---

## Quick start

### Prerequisites

| | |
|---|---|
| Python | 3.10 or later |
| Node.js | 18 or later |
| Database | A PostgreSQL instance — [Supabase](https://supabase.com) free tier is fine |

### 1. Database

Create a Supabase project, then take **Connect → Connection string → Session pooler**.

> Two traps, both of which fail with a misleading error:
>
> - Use the **session pooler** host (`aws-0-<region>.pooler.supabase.com`). The
>   *direct* connection (`db.<ref>.supabase.co`) is IPv6-only on the free tier and
>   fails as `connection refused` on an IPv4 network — which reads like a firewall
>   problem. The *transaction* pooler on port 6543 breaks Alembic. Use **5432**.
> - **Percent-encode reserved characters in the password.** SQLAlchemy URL-decodes it,
>   so a literal `%` must be written `%25`, `@` as `%40`, `/` as `%2F`. Unescaped, it
>   fails as `password authentication failed` — which reads like a wrong password.

Copy `.env.example` to `.env` and set:

```bash
DATABASE_URL=postgresql+psycopg2://postgres.<ref>:<url-encoded-password>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

Note the `+psycopg2` suffix — that is the driver pinned in `requirements.txt`.

### 2. Backend

```bash
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt   # Windows
# source .venv/bin/activate && pip install -r requirements.txt  # macOS / Linux

.venv\Scripts\python.exe -m alembic upgrade head   # create the schema
.venv\Scripts\python.exe seed.py                   # load the demo projects
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

The API is now on `http://localhost:8000`, with interactive docs at
`http://localhost:8000/docs`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

### 4. Confirm it works

```bash
.venv\Scripts\python.exe smoke_test.py
```

53 checks across every feature, standard library only, cleans up after itself. It must
finish with:

```
  53 passed, 0 failed
  Core functionality is working. Safe to demo.
```

If it does not, fix that before demonstrating anything.

---

## Architecture

```
Browser
   |
   |  Next.js 14 (App Router, TypeScript, Tailwind)
   |    /              landing
   |    /dashboard     portfolio overview, risk distribution, attention table
   |    /projects      full list with filters
   |    /projects/[id] decision-support report per project
   |    /projects/new  assess a site on a map before it starts
   |    /map           site map with risk filtering
   |
   v  REST (JSON)
FastAPI
   |    app/routers/   projects, crud, estimate, admin
   |    app/risk.py    scoring entry point, falls back to a rule if no model
   |    app/model.py   trained model + SHAP
   |    app/factor_config.py   phrasing templates + recommendation rules
   |    app/stages.py  statutory stage baselines (single source)
   |
   v  SQLAlchemy 2.0 + Alembic
PostgreSQL (Supabase) — 13 tables
```

Deliberately absent: Docker, message queues, Redis, authentication, service layers,
state-management libraries. This is a hackathon MVP and every one of those would be
weight without benefit at this size.

---

## API reference

Base URL `http://localhost:8000`. Full interactive docs at `/docs`.

### Read

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness |
| `GET` | `/projects` | List with predictions. Filters: `sector`, `stage`, `location`, `sort` |
| `GET` | `/projects/{id}` | Full detail: stage history, litigation, compensation, prediction |
| `GET` | `/projects/{id}/predict` | Current risk, persisted for audit |
| `GET` | `/projects/{id}/explain` | Ranked SHAP factors |
| `GET` | `/projects/{id}/flags` | Review flags raised against the project |
| `GET` | `/admin/model` | Model version, training date, metrics, stage baselines and their source |

### Write

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/projects` | Create. Opens the current stage automatically |
| `PATCH` | `/projects/{id}` | Update editable fields |
| `DELETE` | `/projects/{id}` | Delete, cascading to all child records |
| `POST` | `/projects/{id}/stages` | Advance a stage, closing the previous one |
| `POST` | `/projects/{id}/litigation` | File a case |
| `PATCH` | `/projects/{id}/litigation/{litId}` | Resolve or withdraw |
| `DELETE` | `/projects/{id}/litigation/{litId}` | Remove |
| `POST` | `/projects/{id}/compensation` | Append a disbursement reading |
| `POST` | `/projects/{id}/what-if` | Re-score against modified features. Stored as a scenario, never as fact |
| `POST` | `/projects/{id}/flag` | Flag for review with the rationale attached |
| `POST` | `/estimate/new-project` | Score a site that has no record yet |

Every write is recorded in `audit_logs`.

`PATCH /projects/{id}` deliberately **rejects** a `current_stage` change with a 400
pointing at `/stages`, so a project's stage can never drift out of step with its
history.

---

## The machine learning

### The delay label — the most important choice in the project

```python
# ml/delay_label.py
DELAY_THRESHOLD = 1.5
delayed = actual_elapsed_days > 1.5 * expected_total_days(current_stage)
```

A project counts as delayed once it exceeds **1.5× the statutory baseline** for the
stages it has reached.

**This is PROVISIONAL and needs domain sign-off.** It is the assumption everything
else rests on, and it has a real weakness: NHAI's timeline is a *target*, not observed
practice. If real acquisitions routinely run 2–3× the target, this threshold would
flag almost everything, which is useless for prioritisation. Three alternatives and
five specific questions for a reviewer are in
[`phase0_decisions.md`](phase0_decisions.md).

### Stage baselines

Sourced from **NHAI Circular No. 7.1.83/2025 (9 April 2025)**, which publishes an
eight-stage timeline totalling 336 days, plus the 21-day objection period fixed by
s.3C of the National Highways Act, 1956.

| Stage | Days | Meaning |
|---|---|---|
| 3A | 21 | Notification of intent |
| 3C | 21 | Objections heard |
| 3D | 69 | Declaration — land vests |
| 3G | 95 | Compensation determined |
| 3H | 10 | Compensation deposited |
| 3E | 90 | Possession taken |
| | **306** | **Total to possession — reconciles with the circular** |

There is no section 3B. These live in one place, [`app/stages.py`](app/stages.py), and
the API sends `expected_days` and `days_vs_baseline` per stage so the frontend holds
no copy.

### Training

```bash
.venv\Scripts\python.exe -m ml.generate_dataset   # 3,000 synthetic projects
.venv\Scripts\python.exe -m ml.train              # compare, calibrate, persist
```

**Classifier** — logistic regression, selected over Random Forest and XGBoost on
**recall for the delayed class**. A 35% base rate makes accuracy meaningless, and
missing a delayed project costs more than a false alarm an officer can dismiss.

```
AUC 0.896   recall 0.784   precision 0.701
confusion   tn 435   fp 79   fn 51   tp 185
calibration sigmoid, Brier 0.1229 -> 0.1171
```

Probability is clamped at 0.99 — a system trained on synthetic data should never
display certainty.

**Regressor** — three quantile models (10/50/90) predicting days of overrun, so the
card shows a **range** rather than false precision.

```
MAE 25.4 days   interval coverage 76.8%   within-stage agreement 0.889
```

That last figure is a guard: the classifier's target is *relative* to the stage
baseline while the regressor's is *absolute days*, so agreement is measured within
stage — which is what a card showing one project at one stage depends on. Training
warns if it drops below 0.7.

### Two traps already hit and fixed — do not reintroduce

**Circular labelling.** The first version scored AUC 0.99, because it labelled a
project delayed using the same elapsed time that defines the label — predicting that a
late project is late. Features are now observed *before* the threshold is crossed and
the target is the eventual outcome. The honest number is ~0.90.

**Collinear features.** Keeping both `days_in_current_stage` and
`stage_overrun_ratio` — the same signal divided by a per-stage constant — let the
linear model split one coefficient into two opposing ones, and SHAP then reported
schedule overrun as *reducing* risk. Only the ratio is a feature now.

---

## Project layout

```
app/                    FastAPI service
  main.py               app, CORS, router registration
  database.py           engine and session
  stages.py             statutory baselines — single source
  risk.py               scoring entry point, rule fallback
  model.py              trained model + SHAP inference
  factor_config.py      phrasing templates + recommendation rules
  models/               13 SQLAlchemy models
  routers/              projects, crud, estimate, admin
  schemas/              Pydantic request/response shapes
alembic/versions/       4 migrations, head ddaba4e9f2ac
ml/
  delay_label.py        the delay definition
  generate_dataset.py   synthetic data generator
  train.py              compare, calibrate, persist
  artifacts/            model.joblib + metrics.json
  data/                 synthetic_projects.csv
frontend/
  app/                  6 routes (App Router)
  components/           18 components
  lib/                  api.ts, types.ts, assets.ts, stages.ts
  public/images/        hero photographs — see the README there
seed.py                 loads the demo projects
smoke_test.py           53-check end-to-end verification
```

---

## Common tasks

```bash
# Reset the demo data
.venv\Scripts\python.exe seed.py

# Retrain from scratch
.venv\Scripts\python.exe -m ml.generate_dataset
.venv\Scripts\python.exe -m ml.train

# New migration after a model change
.venv\Scripts\python.exe -m alembic revision --autogenerate -m "what changed"
.venv\Scripts\python.exe -m alembic upgrade head

# Frontend checks
cd frontend && npx tsc --noEmit && npm run build
```

**Change the hero photographs:** drop files into `frontend/public/images/` and point
the three slots in `frontend/lib/assets.ts` at them. A missing or broken file falls
back to a drawn highway scene, so it degrades rather than breaking.

**Change a recommendation rule:** edit `app/factor_config.py`. No retraining needed —
that layer is deliberately not learned.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Failed to fetch` in the browser | API not running | Start uvicorn on port 8000 |
| Pages render as unstyled text | Stale `.next` and a running dev server disagreeing | Stop node, `rm -rf .next`, restart, hard-refresh (Ctrl+Shift+R) |
| `EADDRINUSE` | An orphaned server holds the port | `taskkill /F /IM node.exe` / `taskkill /F /IM python.exe` |
| `password authentication failed` | Unescaped `%` in the DB password | Percent-encode it — `%` becomes `%25` |
| `connection refused` to Supabase | Using the direct (IPv6) connection | Switch to the session pooler host |
| Alembic: `invalid interpolation syntax` | `%` in the URL reaching configparser | Already handled in `alembic/env.py`; check you did not revert it |
| `npm run dev` fails oddly on Windows | PowerShell `$PSNativeCommandArgumentPassing = "Windows"` mangles `.ps1` shim arguments | Use `npm.cmd run dev` |

**When anything looks wrong, kill every stray `node.exe` and `python.exe` first.**
Stale servers serving pre-change code have been the cause more often than real bugs.

---

## Known limitations

Stated plainly, because the honest version is more defensible than the impressive one.

- **Trained on synthetic data.** The metrics measure the pipeline, not real-world
  accuracy.
- **The delay threshold is unvalidated.** It needs a domain expert.
- **SHAP shows contribution, not causation.** Low compensation may be the cause of a
  stall, or a symptom of the dispute causing it.
- **Location is not a model feature.** The map records where a site is; it does not
  score by district. Scoring by region would mean inventing a regional claim from
  data we do not have.
- **No authentication.** `AuditLog.user_id` is null on every write. The `users` table
  exists but nothing reads it.
- **No currency anywhere.** Compensation is stored as a percentage, so no rupee
  figure can be derived.
- **Rehabilitation progress is a single column**, not a time series.

---

## Documentation index

| File | What it covers |
|---|---|
| [`prd.md`](prd.md) | Product requirements, personas, scope |
| [`technicaldesign.md`](technicaldesign.md) | System architecture |
| [`datamodel.md`](datamodel.md) | Entities and relationships |
| [`datadictionary.md`](datadictionary.md) | Every table and column |
| [`datasources.md`](datasources.md) | Source register — and why labels are the constraint |
| [`phase0_decisions.md`](phase0_decisions.md) | Domain lock, stage baselines, the open delay-label question |
| [`engineeringplan.md`](engineeringplan.md) | Phased roadmap |
| [`designbrief.md`](designbrief.md) | Visual language and trust principles |

---

## Licence and attribution

Prototype built for Smart India Hackathon SIH26017. Stage baselines derive from NHAI
Circular No. 7.1.83/2025 and the National Highways Act, 1956.

**Not an official Government of India application.**
