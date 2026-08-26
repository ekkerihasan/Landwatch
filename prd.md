# LANDWATCH — Product Requirements Document (PRD)

SIH26017 — Predictive Analytics System for Early Detection of Land Acquisition Delays
Version 0.1 — Draft for Mentor Review

## 1. Executive Summary

LANDWATCH is a decision-support layer that sits on top of existing land-acquisition workflow systems. It does not replace them. It consumes project and acquisition-process data, predicts the risk that a project will face a significant delay, explains why using SHAP, and lets an officer simulate what-if interventions before acting. The system is explicitly **not** an automatic decision-maker and does not claim causal or exact-date predictions.

## 2. Problem Statement

Land acquisition is a frequent bottleneck for infrastructure projects. Officers and administrators can see current status through existing tracking systems, but have no early warning of which projects are heading toward significant delay until the delay has already happened. LANDWATCH adds a predictive layer on top of status data so intervention can happen earlier.

## 3. Goals

- Predict delay risk (Low / Medium / High / Critical) for an acquisition project from process and legal-stage data.
- Explain each high-risk prediction with the top contributing factors (SHAP).
- Let an officer test "what-if" changes to actionable factors and see the resulting risk shift.
- Surface a prioritised, risk-ranked list so limited officer attention goes to the projects that need it most.
- Keep a human in the loop at every decision point — the system recommends, it does not act.

## 4. Non-Goals / Out of Scope (v1)

- Replacing the existing acquisition workflow or system of record.
- Predicting an exact completion date or exact delay duration.
- Claiming SHAP output as proof of causation.
- Automated actions taken without officer sign-off.
- Full national rollout — v1 targets one workflow/domain (proposed: National Highway land acquisition, given Bhoomi Rashi's clearer structure) as the prototype scope.

## 5. Users & Personas

| Persona | Who | What they need from LANDWATCH |
|---|---|---|
| Field/District Officer | Handles day-to-day acquisition casework for a set of projects | A ranked view of their projects by risk, and a clear reason for any high-risk flag so they know what to check first |
| Supervisor / Nodal Officer | Oversees multiple officers or a region | Portfolio-level view, ability to reassign priority, escalation visibility |
| Data/Admin User | Maintains data feeds and system health | Ingestion status, data-quality flags, model version and retrain history |
| Mentor / Evaluator (SIH) | Assesses the prototype | A clear, honest demonstration of the pipeline, explainability and limitations |

## 6. Core Features

| Feature | Priority | Description |
|---|---|---|
| Risk Dashboard | P0 | Ranked list of projects with current risk level, trend, and key stage info |
| Project Detail View | P0 | Full acquisition-stage timeline, inputs, and current prediction for one project |
| Delay-Risk Prediction (XGBoost) | P0 | Low/Medium/High/Critical classification from process + legal-stage features |
| SHAP Explanation Panel | P0 | Top contributing factors for a given prediction, shown per project |
| What-If Simulator | P0 | Officer adjusts an actionable input (e.g. compensation %) and sees re-predicted risk |
| Legal Workflow Tracker (3A→3C→3D→3G→3H/3E) | P1 | Visual stage tracker with alerts when a project stalls in a stage |
| Data Ingestion & Validation | P0 | Structured intake of project/process data with validation and data-quality flags |
| Recommendation / Flag for Review | P1 | Officer can flag a project for investigation with the model's rationale attached |
| Feedback Loop | P2 | Officer records actual outcome, feeding future retraining |
| Synthetic/Real Data Toggle & Disclosure | P0 | Any synthetic data is clearly labelled as such throughout the UI |

## 7. Success Metrics (Prototype Stage)

- **Model:** AUC-ROC and recall on the "significant delay" class on a held-out set, not accuracy alone.
- **Explainability:** every High/Critical prediction returns a non-empty, sensible SHAP top-factor list.
- **Usability:** an officer can go from dashboard → explanation → what-if in under 3 clicks.
- **Trust/demo:** mentor and judges can articulate what the system does and does not claim, unprompted.

## 8. Assumptions & Constraints

- A validated labelled dataset does not exist yet — this is the primary project risk, not the ML code.
- The delay-label definition (statutory baseline vs. historical baseline vs. severity band) is undecided and must be validated with the mentor/domain expert before the model is locked.
- If real labelled data is insufficient for the prototype deadline, synthetic data will be used for demonstration only, clearly marked as synthetic and never presented as real-world validation.

## 9. Open Questions Carried Over for the Mentor

- How should delay be defined for the ML target: statutory/expected duration, actual-vs-planned, or severity bands?
- Is there any publicly accessible historical dataset with both process features and actual delay outcomes?
- Should the prototype narrow to National Highway acquisition given Bhoomi Rashi's clearer data structure?
- What minimum dataset size/validation standard counts as credible for an SIH prototype?
- Which proposed input variables are genuinely actionable by an officer, and therefore appropriate for the What-If simulator?