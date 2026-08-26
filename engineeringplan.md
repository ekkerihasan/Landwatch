# LANDWATCH — Engineering Plan

## 1. Phased Roadmap

| Phase | Focus | Key Deliverables |
|---|---|---|
| **Phase 0 — Foundations** | Lock scope & definitions before heavy coding | Chosen prototype domain (e.g. NH acquisition); agreed delay-label definition; data-source table (source, fields, access, coverage, label availability) |
| **Phase 1 — Skeleton** | Backend + DB + minimal frontend shell | PostgreSQL schema live; FastAPI CRUD for Project/Stage/Litigation; Next.js shell hitting real endpoints with placeholder data |
| **Phase 2 — Baseline Model** | Get a working, honest baseline before XGBoost | Cleaned small real (or clearly-labelled synthetic) sample; Logistic Regression baseline; evaluation beyond accuracy (recall/AUC on delay class) |
| **Phase 3 — Advanced Model + Explainability** | Upgrade model, add SHAP | XGBoost trained and compared against baseline; SHAP explainer wired into the API; `/predict` and `/explain` endpoints live |
| **Phase 4 — Dashboard + What-If** | Full frontend experience | Risk dashboard, project detail, SHAP panel, What-If simulator wired to `/what-if`; risk colour system implemented |
| **Phase 5 — Hardening & Demo Prep** | Polish, audit trail, disclosure | Audit logging; real-vs-synthetic labelling throughout UI; data dictionary written; 30-second pitch rehearsed against the actual running system |

## 2. Suggested Role Split

| Role | Responsibility |
|---|---|
| Backend/API Engineer | FastAPI service, PostgreSQL schema/migrations, auth |
| ML Engineer | Feature engineering, model training/evaluation, SHAP integration |
| Frontend Engineer | Next.js dashboard, project detail, SHAP/what-if UI |
| Data/Domain Lead | Source data collection, delay-label definition, data dictionary, real-vs-synthetic tracking |
| Team Lead / Storyteller | Mentor round narrative, demo script, keeps overclaiming out of the pitch |

## 3. Immediate Next Steps

1. Lock the prototype domain (recommend narrowing to National Highway acquisition via Bhoomi Rashi for a cleaner, more consistent feature set).
2. Validate the delay-label definition with the mentor before writing a single line of model code.
3. Build the data-source table and pull a small real sample to sanity-check assumptions.
4. Stand up the DB schema and API skeleton in parallel with data collection.
5. Baseline model first, XGBoost second, SHAP third — in that order, not reversed.