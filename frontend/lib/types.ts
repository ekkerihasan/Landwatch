// Mirrors docs/05_Data_Model.md — Project entity
// See also app/models/project.py for DB mapping

export type AcquisitionStage = "3A" | "3C" | "3D" | "3G" | "3H" | "3E";

export interface Project {
  project_id: number;
  name: string;
  location: string;
  sector: string;
  area: number | null;
  paf_count: number | null;
  current_stage: AcquisitionStage | string;
  created_at: string; // ISO 8601
}

// Future: extended detail shape from technicaldesign.md §3 GET /projects/{id}
export interface ProjectDetail extends Project {
  // Will include stage_history, litigations, compensation_records when API is live
  stage_history?: unknown[];
  litigations?: unknown[];
}
