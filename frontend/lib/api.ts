import type {
  CurrentFeatures,
  Flag,
  NewProjectEstimate,
  Project,
  ProjectCreatePayload,
  ProjectDetail,
  WhatIfResponse,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Fetch projects from FastAPI GET /projects (technicaldesign.md §3).
 * Falls back to local mock JSON when API is unavailable — matches
 * docs/05_Data_Model.md Project shape.
 */
export async function fetchProjects(): Promise<{ projects: Project[]; source: "api" | "mock" }> {
  // Try live API first — endpoint per technicaldesign.md §3: GET /projects
  try {
    const res = await fetch(`${API_URL}/projects`, {
      // Disable Next.js fetch cache for dashboard data
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      // Support both { projects: [...] } and bare array responses
      const projects: Project[] = Array.isArray(data) ? data : data.projects ?? data;
      if (Array.isArray(projects)) {
        return { projects, source: "api" };
      }
    }
  } catch {
    // Network error — fall through to mock
  }

  // Mock fallback: public/mock-projects.json (5 fake Projects, datamodel.md shape)
  const mockRes = await fetch("/mock-projects.json", { cache: "no-store" });
  if (!mockRes.ok) throw new Error("Failed to load mock projects");
  const mockProjects: Project[] = await mockRes.json();
  return { projects: mockProjects, source: "mock" };
}

/** GET /projects/{id} — full detail incl. stage history and what-if baseline. */
export async function fetchProject(id: number): Promise<ProjectDetail> {
  const res = await fetch(`${API_URL}/projects/${id}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (res.status === 404) throw new Error(`Project ${id} not found`);
  if (!res.ok) throw new Error(`API returned ${res.status}. Is the FastAPI server running?`);
  return res.json();
}

/** POST /projects/{id}/what-if — scenario re-score, never persisted as fact. */
export async function runWhatIf(
  id: number,
  overrides: Partial<CurrentFeatures>
): Promise<WhatIfResponse> {
  const res = await fetch(`${API_URL}/projects/${id}/what-if`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(overrides),
  });
  if (!res.ok) throw new Error(`What-if failed (${res.status})`);
  return res.json();
}

/** POST /projects/{id}/flag — officer flags for review, rationale attached. */
export async function flagProject(id: number, note: string): Promise<Flag> {
  const res = await fetch(`${API_URL}/projects/${id}/flag`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });
  if (!res.ok) throw new Error(`Flag failed (${res.status})`);
  return res.json();
}

/** POST /estimate/new-project — score a site that has no record yet. */
export async function estimateNewProject(
  payload: Record<string, unknown>
): Promise<NewProjectEstimate> {
  const res = await fetch(`${API_URL}/estimate/new-project`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Estimate failed (${res.status}). Is the API running?`);
  return res.json();
}

/** POST /projects — create a tracked project. */
export async function createProject(payload: ProjectCreatePayload): Promise<ProjectDetail> {
  const res = await fetch(`${API_URL}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await describeError(res, "Could not create the project"));
  return res.json();
}

/** PATCH /projects/{id} — update editable fields. Stage changes go via /stages. */
export async function updateProject(
  id: number,
  payload: Partial<ProjectCreatePayload>
): Promise<ProjectDetail> {
  const res = await fetch(`${API_URL}/projects/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await describeError(res, "Could not update the project"));
  return res.json();
}

/** DELETE /projects/{id} — removes the project and everything attached to it. */
export async function deleteProject(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/projects/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await describeError(res, "Could not delete the project"));
}

/** POST /projects/{id}/stages — close the open stage and open the next. */
export async function advanceStage(id: number, stage: string): Promise<unknown> {
  const res = await fetch(`${API_URL}/projects/${id}/stages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stage }),
  });
  if (!res.ok) throw new Error(await describeError(res, "Could not advance the stage"));
  return res.json();
}

/** POST /projects/{id}/compensation — append a disbursement reading. */
export async function addCompensation(id: number, pct: number): Promise<unknown> {
  const res = await fetch(`${API_URL}/projects/${id}/compensation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ compensation_pct: pct }),
  });
  if (!res.ok) throw new Error(await describeError(res, "Could not record compensation"));
  return res.json();
}

/** POST /projects/{id}/litigation — file a case. */
export async function addLitigation(id: number, type: string): Promise<unknown> {
  const res = await fetch(`${API_URL}/projects/${id}/litigation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "pending", type }),
  });
  if (!res.ok) throw new Error(await describeError(res, "Could not add the case"));
  return res.json();
}

/** PATCH /projects/{id}/litigation/{litId} — resolve or withdraw a case. */
export async function updateLitigation(
  id: number,
  litigationId: number,
  status: string
): Promise<unknown> {
  const res = await fetch(`${API_URL}/projects/${id}/litigation/${litigationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await describeError(res, "Could not update the case"));
  return res.json();
}

/** FastAPI puts the useful message in `detail`; surface it instead of a bare status. */
async function describeError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") return body.detail;
  } catch {
    // non-JSON body — fall through
  }
  return `${fallback} (${res.status})`;
}
