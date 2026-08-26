import type { Project } from "./types";

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
