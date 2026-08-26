"use client";

import { useEffect, useMemo, useState } from "react";
import { ProjectTable } from "@/components/ProjectTable";
import { fetchProjects } from "@/lib/api";
import type { Project } from "@/lib/types";

export default function RiskDashboard() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [source, setSource] = useState<"api" | "mock" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterSector, setFilterSector] = useState<string>("all");
  const [filterStage, setFilterStage] = useState<string>("all");
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"risk" | "created_at" | "name">("risk");

  useEffect(() => {
    let cancelled = false;
    // Calls GET /projects per technicaldesign.md §3 — with mock fallback
    fetchProjects()
      .then(({ projects, source }) => {
        if (!cancelled) {
          setProjects(projects);
          setSource(source);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sectors = useMemo(
    () => Array.from(new Set((projects ?? []).map((p) => p.sector))).sort(),
    [projects]
  );
  const stages = useMemo(
    () => Array.from(new Set((projects ?? []).map((p) => p.current_stage))).sort(),
    [projects]
  );
  const locations = useMemo(
    () => Array.from(new Set((projects ?? []).map((p) => p.location))).sort(),
    [projects]
  );

  const filteredAndSorted = useMemo(() => {
    if (!projects) return [];
    let out = [...projects];
    if (filterSector !== "all") out = out.filter((p) => p.sector === filterSector);
    if (filterStage !== "all") out = out.filter((p) => p.current_stage === filterStage);
    if (filterLocation !== "all") out = out.filter((p) => p.location === filterLocation);

    // Simple deterministic risk rank for demo (replace with real risk_class from API)
    const riskRank: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    const mockRisk = (id: number) => ["Low", "Medium", "High", "Critical"][id % 4] as string;

    if (sortBy === "risk") {
      out.sort((a, b) => riskRank[mockRisk(b.project_id)] - riskRank[mockRisk(a.project_id)]);
    } else if (sortBy === "created_at") {
      out.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === "name") {
      out.sort((a, b) => a.name.localeCompare(b.name));
    }
    return out;
  }, [projects, filterSector, filterStage, filterLocation, sortBy]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <p className="font-semibold">Failed to load projects</p>
        <p className="mt-1">{error}</p>
        <p className="mt-3 text-xs text-red-600">
          Expected: <code>GET /projects</code> per technicaldesign.md §3. Check FastAPI is running or verify{" "}
          <code>/mock-projects.json</code> exists.
        </p>
      </div>
    );
  }

  if (projects === null) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title row — Design Brief §3: ranked project list, risk badge, filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Risk Dashboard</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Ranked list of acquisition projects with current risk level. Data is{" "}
            <span className="font-medium text-amber-700">synthetic/demo</span> until the ingestion pipeline
            provides validated records (PRD §8).
          </p>
          {/* Provenance label — Design Brief §4: every AI view distinguishes demo vs ground truth */}
          <p className="mt-2 inline-flex items-center gap-2 rounded bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Source:{" "}
            {source === "api" ? "Live API — GET /projects" : "Mock JSON — /mock-projects.json"} • 5 demo Projects
            shaped per datamodel.md
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{filteredAndSorted.length} projects</span>
          <span className="h-3 w-px bg-slate-200" />
          <a href="/mock-projects.json" target="_blank" className="underline hover:text-slate-700">
            View mock JSON
          </a>
        </div>
      </div>

      {/* Filters — Design Brief §3: quick filters (region, sector, stage) + sortable */}
      <div className="flex flex-wrap gap-3 rounded-xl border bg-white p-4 shadow-sm">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Sector
          <select
            value={filterSector}
            onChange={(e) => setFilterSector(e.target.value)}
            className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900"
          >
            <option value="all">All sectors</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Stage (3A→3E)
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900"
          >
            <option value="all">All stages</option>
            {stages.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Region / Location
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900"
          >
            <option value="all">All locations</option>
            {locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Sort by
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900"
          >
            <option value="risk">Risk (Critical → Low)</option>
            <option value="created_at">Newest</option>
            <option value="name">Name (A→Z)</option>
          </select>
        </label>
        {(filterSector !== "all" || filterStage !== "all" || filterLocation !== "all") && (
          <button
            onClick={() => {
              setFilterSector("all");
              setFilterStage("all");
              setFilterLocation("all");
            }}
            className="self-end rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table / Cards */}
      <ProjectTable projects={filteredAndSorted} />

      {/* Footnote — explainability placeholder per PRD + Design Brief */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
        <p className="font-semibold text-slate-700">What you see here</p>
        <p className="mt-1">
          This dashboard calls <code className="rounded bg-white px-1 py-0.5">GET /projects</code> as specified
          in <code className="rounded bg-white px-1 py-0.5">technicaldesign.md §3</code>. Each row is a{" "}
          <code className="rounded bg-white px-1 py-0.5">Project</code> per{" "}
          <code className="rounded bg-white px-1 py-0.5">datamodel.md</code> (project_id, name, location, sector,
          area, paf_count, current_stage, created_at). Risk badges are mock-ranked for layout — live predictions
          will come from <code className="rounded bg-white px-1 py-0.5">GET /projects/&#123;id&#125;/predict</code>{" "}
          and SHAP explanations from <code className="rounded bg-white px-1 py-0.5">/explain</code>. No auth yet —
          role-based access (Officer/Supervisor/Admin) will gate this view later.
        </p>
      </div>
    </div>
  );
}
