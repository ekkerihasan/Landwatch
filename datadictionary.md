# LANDWATCH — Data Dictionary

Phase 5 deliverable (engineeringplan.md §1). Every table currently in the database,
generated against migration `7be5f526d699`. 13 tables.

## 1. Core acquisition records

### `projects`
| Column | Type | Notes |
|---|---|---|
| `project_id` | int PK | |
| `name` | varchar(255) | Indexed |
| `location` | varchar(255) | District, State |
| `sector` | varchar(100) | Indexed. v1 scope is "National Highway" |
| `area` | float | Hectares |
| `paf_count` | int | Project Affected Families |
| `current_stage` | varchar(10) | Indexed. One of 3A/3C/3D/3G/3H/3E |
| `created_at` | timestamptz | Defaults to now() |

### `acquisition_stage_history`
| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `project_id` | int FK → projects | Cascade delete |
| `stage` | varchar(10) | |
| `entered_at` | timestamptz | |
| `exited_at` | timestamptz null | **Null means the stage is still open** — this is what the risk rule reads |
| `days_in_stage` | int null | Populated on exit; derived live for open stages |

### `litigations`
| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `project_id` | int FK → projects | |
| `status` | varchar(50) | Indexed. `pending` / `resolved` / `withdrawn`. Only `pending` counts toward risk |
| `type` | varchar(100) null | e.g. title dispute, compensation dispute |
| `filed_at` / `resolved_at` | timestamptz | |

### `compensation_records`
| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `project_id` | int FK → projects | |
| `compensation_pct` | float | 0–100. The most recent row wins |
| `updated_at` | timestamptz | Auto-updates |

## 2. Prediction and explanation

### `project_feature_snapshots`
Point-in-time feature vector behind a prediction. `feature_json` (JSON), `snapshot_at`,
`is_synthetic` (bool, indexed), `data_source_id` FK → data_sources.

### `prediction_results`
| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `project_id` | int FK | |
| `snapshot_id` | int FK null | |
| `model_version` | varchar(100) | Currently `rule-based-placeholder-v0` |
| `risk_class` | varchar(20) | Indexed. Low / Medium / High / Critical |
| `probability` | float | 0.01–0.99 |
| `is_mock_prediction` | bool | **True while the interim rule is in use** |
| `predicted_at` | timestamptz | Indexed |

Written on `/predict` and `/flag`. Deliberately *not* written on every `/projects`
list call — that would flood the table during normal dashboard browsing.

### `shap_explanations`
One row per contributing factor, `rank` 1..n. Holds rule contributions today, SHAP
values once the model lands. Columns: `prediction_id` FK, `feature_name`,
`feature_value`, `contribution_value`, `rank`, `explanation` (plain-language line).

## 3. Officer actions and feedback

### `what_if_scenarios`
Kept separate from `prediction_results` so a hypothetical is never mistaken for a real
prediction. Columns: `project_id`, `base_prediction_id` FK, `created_by` FK → users,
`modified_features_json` (JSON), `resulting_risk_class`, `resulting_probability`.

### `project_flags`
`project_id`, `prediction_id` FK (the rationale attached at flag time), `flagged_by`,
`note`, `status` (`open`/`resolved`, indexed).

### `delay_outcomes`
Ground truth for retraining. `actual_outcome` (text), `delay_label` (varchar, indexed)
— **the training target, blank until the label definition is agreed** (prd.md §9).

### `audit_logs`
`user_id`, `action` (indexed: `what_if_run` / `flag_for_review` / `dismiss`),
`entity_type`, `entity_id`, `details` (JSON), `timestamp` (indexed).

### `users`
`user_id`, `name`, `role` (indexed: officer/supervisor/admin), `region_scope`.
Present in schema; **no auth is implemented** — `user_id` is null on all writes.

### `data_sources`
`name`, `type` (indexed), `last_validated_at`, `coverage_notes`. See datasources.md.

## 4. Engineered features

The three inputs the scorer consumes. All derived at request time — none stored as columns.

| Feature | Derived from | Officer-actionable? |
|---|---|---|
| `days_in_current_stage` | Days since `entered_at` of the open `acquisition_stage_history` row | Indirectly — by clearing the stage |
| `open_litigations` | Count of `litigations` with `status='pending'` | Yes |
| `compensation_pct` | Most recent `compensation_records.compensation_pct` | Yes — the most direct lever |

Expected stage durations used as the overrun baseline (`app/risk.py`):
3A 60d · 3C 90d · 3D 120d · 3G 90d · 3H 60d · 3E 45d. **Placeholder values** pending
mentor confirmation.

## 5. Provenance

All data currently in the database is **synthetic**, loaded by `seed.py`. Real records
must be tagged via `project_feature_snapshots.is_synthetic = false` and attributed to a
`data_sources` row. The UI labels synthetic data throughout and never blends the two.
