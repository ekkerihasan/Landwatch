// Mirrors datamodel.md — see app/models/ (DB) and app/schemas/project.py (API shape)

export type AcquisitionStage = "3A" | "3C" | "3D" | "3G" | "3H" | "3E";

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export interface RiskFactor {
  feature: string;
  value: number;
  contribution: number;
  explanation: string;
}

// Predicted overrun as a RANGE. A point estimate to the day, from a model trained on
// synthetic data, is not defensible — so the API returns quantiles.
export interface DelayEstimate {
  lower_days: number;
  median_days: number;
  upper_days: number;
  mae_days: number | null;
  interval_coverage: number | null;
}

// Deterministic rule output from app/factor_config.py — NOT model output.
export interface Recommendation {
  id: string;
  action: string;
  detail: string;
  owner: string;
  severity: number;
  triggered_by: string;
}

// From GET /projects/{id}/predict.
export interface Prediction {
  risk_class: RiskLevel;
  probability: number;
  factors: RiskFactor[];
  model_version: string;
  is_mock_prediction: boolean;
  // Inputs the model had no data for — a neutral value was substituted.
  missing_inputs: string[];
  recommendations: Recommendation[];
  delay_estimate: DelayEstimate | null;
}

export interface Project {
  project_id: number;
  name: string;
  location: string;
  sector: string;
  area: number | null;
  paf_count: number | null;
  current_stage: AcquisitionStage | string;
  latitude: number | null;
  longitude: number | null;
  rehabilitation_progress_pct: number | null;
  created_at: string; // ISO 8601
  prediction: Prediction;
}

// The only inputs an officer can move — what the What-If simulator exposes.
export interface CurrentFeatures {
  days_in_current_stage: number;
  open_litigations: number;
  compensation_pct: number;
}

export interface StageHistoryRow {
  id: number;
  stage: string;
  label: string;
  entered_at: string;
  exited_at: string | null;
  days_in_stage: number | null;
  // Derived server-side from app/stages.py — the frontend holds no copy of the
  // statutory durations, so the two can never disagree.
  expected_days: number;
  elapsed_days: number;
  days_vs_baseline: number;
}

export interface LitigationRow {
  id: number;
  status: string;
  type: string | null;
  filed_at: string;
  resolved_at: string | null;
}

export interface CompensationRow {
  id: number;
  compensation_pct: number;
  updated_at: string;
}

export interface ProjectDetail extends Project {
  current_features: CurrentFeatures;
  stage_history: StageHistoryRow[];
  litigations: LitigationRow[];
  compensation_records: CompensationRow[];
}

export interface WhatIfResponse {
  scenario_id: number;
  baseline: Prediction;
  scenario: Prediction;
  modified_features: Record<string, number>;
  probability_delta: number;
  is_scenario: boolean;
  disclaimer: string;
}

export interface Flag {
  id: number;
  project_id: number;
  note: string | null;
  status: string;
  created_at: string;
}

export interface NewProjectEstimate {
  prediction: Prediction;
  inputs: Record<string, unknown>;
  assumed_inputs: string[];
  is_estimate: boolean;
  disclaimer: string;
}

export interface ProjectCreatePayload {
  name: string;
  location: string;
  sector?: string;
  area?: number | null;
  paf_count?: number | null;
  current_stage?: string;
  latitude?: number | null;
  longitude?: number | null;
  rehabilitation_progress_pct?: number | null;
}
