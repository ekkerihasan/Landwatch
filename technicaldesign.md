# LANDWATCH — Technical Design (System Architecture)

## 1. High-Level Components

- **Web Client** — Next.js/React dashboard, server-rendered for fast first load, client-side interactivity for the What-If simulator.
- **API Layer** — FastAPI service exposing REST endpoints for projects, predictions, explanations, and what-if scenarios.
- **ML Service** — prediction + SHAP explanation, callable from the API layer (in-process for the prototype; can be split into its own service later).
- **Data Ingestion / ETL** — scheduled or on-demand jobs that pull, validate, and normalise source data (Bhoomi Rashi/MoRTH/NHAI extracts, government reports, or synthetic generators) into the feature tables.
- **Database** — PostgreSQL, single source of truth for raw records, engineered features, predictions, explanations, and audit trail.
- **Auth** — role-based access (Officer / Supervisor / Admin), JWT-based sessions issued by the API layer.

## 2. Data Flow

```
Source data
  → Ingestion & validation
  → Feature engineering
  → (offline) Model training/evaluation → versioned model artifact
  → (online) Inference service loads current model
  → API returns risk class + SHAP values
  → Web client renders dashboard / detail / what-if
  → officer action or outcome is written back
  → feeds future retraining
```

## 3. Key API Endpoints (Draft)

| Endpoint | Method | Purpose |
|---|---|---|
| `/auth/login` | POST | Authenticate, issue session token |
| `/projects` | GET | List projects with current risk level, filterable/sortable |
| `/projects/{id}` | GET | Full project detail incl. stage history and current features |
| `/projects/{id}/predict` | GET | Current risk class + probability for the project |
| `/projects/{id}/explain` | GET | SHAP top-factor breakdown for the current prediction |
| `/projects/{id}/what-if` | POST | Re-run prediction against a modified feature payload (scenario only, not persisted as fact) |
| `/projects/{id}/flag` | POST | Officer flags project for review, with attached rationale |
| `/ingestion/sources` | GET/POST | Manage/inspect data sources and last validation status |
| `/admin/model` | GET | Current model version, training date, evaluation metrics |

## 4. ML Pipeline Design

### 4.1 Offline (training)

- Collect historical observations → engineer features (stage, days-in-stage, compensation %, litigation count, SIA/response score, 3A–3D elapsed time, etc.).
- Apply the agreed delay-label definition to produce the training target.
- Clean data, handle missing values, encode categoricals; time-based train/test split to avoid leakage.
- Train and compare a baseline (Logistic Regression) against Random Forest and XGBoost; select by recall/AUC on the delay class, not accuracy alone.
- Fit a SHAP explainer against the selected model; persist model + explainer as a versioned artifact.

### 4.2 Online (inference)

- API loads the current model/explainer version at startup (or on version change).
- Given a project's current features, return risk class + probability; on request, return SHAP top factors.
- What-If requests reuse the same inference path with a modified feature vector, tagged as a scenario in the response.

## 5. Non-Functional Requirements

- **Explainability-by-default:** no High/Critical risk score is shown without an accompanying "why."
- **Auditability:** every prediction, explanation, and officer action (flag, dismiss, what-if run) is logged with timestamp and actor.
- **Data provenance:** every stored record is tagged real vs. synthetic; the UI never blends the two without labelling.
- **Human-in-the-loop:** no endpoint triggers an external action automatically; everything terminates in an officer decision.
- **Reasonable latency:** dashboard loads and prediction calls should feel interactive (target sub-second for cached/precomputed predictions; a few seconds acceptable for a live what-if re-score in the prototype).