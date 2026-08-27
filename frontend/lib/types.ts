// Mirrors datamodel.md — see app/models/ (DB) and app/schemas/project.py (API shape)

export type AcquisitionStage = "3A" | "3C" | "3D" | "3G" | "3H" | "3E";

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export interface RiskFactor {
  feature: string;
  value: number;
  contribution: number;
  explanation: string;
}

// From GET /projects/{id}/predict. While `is_mock_prediction` is true this comes
// from the interim rule in app/risk.py, not a trained model.
export interface Prediction {
  risk_class: RiskLevel;
  probability: number;
  factors: RiskFactor[];
  model_version: string;
  is_mock_prediction: boolean;
}

export interface Project {
  project_id: number;
  name: string;
  location: string;
  sector: string;
  area: number | null;
  paf_count: number | null;
  current_stage: AcquisitionStage | string;
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
  entered_at: string;
  exited_at: string | null;
  days_in_stage: number | null;
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
