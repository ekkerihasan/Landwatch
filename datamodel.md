# LANDWATCH — Data Model

## 1. Core Entities

| Entity | Key Fields | Notes |
|---|---|---|
| **Project** | project_id (PK), name, location, sector, area, PAF count, current_stage, created_at | One row per acquisition project |
| **AcquisitionStageHistory** | id (PK), project_id (FK), stage (3A/3C/3D/3G/3H/3E), entered_at, exited_at, days_in_stage | Time-in-stage history driving the legal workflow tracker |
| **Litigation** | id (PK), project_id (FK), status, filed_at, resolved_at, type | Litigation count/status feeds risk features |
| **CompensationRecord** | id (PK), project_id (FK), compensation_pct, updated_at | Tracks compensation % over time, an actionable what-if variable |
| **ProjectFeatureSnapshot** | id (PK), project_id (FK), snapshot_at, feature_json, is_synthetic | Point-in-time engineered feature vector used for a given prediction |
| **PredictionResult** | id (PK), project_id (FK), model_version, risk_class, probability, predicted_at | Stores every prediction for audit and trend display |
| **ShapExplanation** | id (PK), prediction_id (FK), feature_name, contribution_value, rank | Top-factor breakdown tied to one prediction |
| **WhatIfScenario** | id (PK), project_id (FK), created_by, base_prediction_id (FK), modified_features_json, resulting_risk_class, created_at | Scenario runs are stored separately from real predictions |
| **DelayOutcome** | id (PK), project_id (FK), actual_outcome, delay_label, recorded_at, recorded_by | Ground-truth feedback used for retraining |
| **DataSource** | id (PK), name, type (Bhoomi Rashi / MoRTH / NHAI / synthetic / other), last_validated_at, coverage_notes | One row per external or synthetic data source |
| **User** | user_id (PK), name, role (officer/supervisor/admin), region_scope | Role-based access control |
| **AuditLog** | id (PK), user_id (FK), action, entity_type, entity_id, timestamp | Full trail of flags, dismissals, what-if runs, ingestion approvals |

## 2. Relationships

- `Project` 1—N `AcquisitionStageHistory`, `Litigation`, `CompensationRecord`, `ProjectFeatureSnapshot`, `PredictionResult`, `WhatIfScenario`, `DelayOutcome`.
- `PredictionResult` 1—N `ShapExplanation` (one row per contributing feature).
- `WhatIfScenario` N—1 `PredictionResult` (each scenario references the real prediction it branched from).
- `DataSource` 1—N `ProjectFeatureSnapshot` (provenance of the data behind a feature snapshot).
- Every `ProjectFeatureSnapshot` and `PredictionResult` carries an `is_synthetic` / provenance flag so the UI can label demo data unambiguously.