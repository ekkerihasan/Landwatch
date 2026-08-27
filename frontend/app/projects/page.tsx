"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectTable } from "@/components/ProjectTable";
import { RISK_ORDER } from "@/components/RiskBadge";
import { fetchProjects } from "@/lib/api";
import { STAGE_LABELS } from "@/lib/stages";
import type { Project } from "@/lib/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sector, setSector] = useState("all");
  const [stage, setStage] = useState("all");
  const [location, setLocation] = useState("all");
  const [risk, setRisk] = useState("all");
  const [sortBy, setSortBy] = useState<"risk" | "created_at" | "name">("risk");
  const [view, setView] = useState<"cards" | "table">("cards");

  useEffect(() => {
    let cancelled = false;
    fetchProjects()
      .then(({ projects }) => !cancelled && setProjects(projects))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
  }, []);

  const options = useMemo(() => {
    const list = projects ?? [];
    return {
      sectors: Array.from(new Set(list.map((p) => p.sector))).sort(),
      stages: Array.from(new Set(list.map((p) => p.current_stage))).sort(),
      locations: Array.from(new Set(list.map((p) => p.location))).sort(),
    };
  }, [projects]);

  const filtered = useMemo(() => {
    if (!projects) return [];
    let out = [...projects];
    if (sector !== "all") out = out.filter((p) => p.sector === sector);
    if (stage !== "all") out = out.filter((p) => p.current_stage === stage);
    if (location !== "all") out = out.filter((p) => p.location === location);
    if (risk !== "all") out = out.filter((p) => p.prediction.risk_class === risk);

    if (sortBy === "risk") {
      out.sort(
        (a, b) =>
          RISK_ORDER[b.prediction.risk_class] - RISK_ORDER[a.prediction.risk_class] ||
          b.prediction.probability - a.prediction.probability
      );
    } else if (sortBy === "created_at") {
      out.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      out.sort((a, b) => a.name.localeCompare(b.name));
    }
    return out;
  }, [projects, sector, stage, location, risk, sortBy]);

  const anyFilter = sector !== "all" || stage !== "all" || location !== "all" || risk !== "all";
  const select =
    "rounded border border-line bg-cream-surface px-2.5 py-1.5 text-sm text-ink focus:border-forest-600 focus:outline-none focus:ring-1 focus:ring-forest-600";
  const label = "flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-ink-3";

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-card border border-risk-critical/30 bg-risk-criticalBg p-6 text-sm text-risk-critical">
          <p className="font-semibold">Could not load projects</p>
          <p className="mt-1">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Projects</h1>
          <p className="mt-1 text-sm text-ink-2">
            Every acquisition on record, ranked by delay risk.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="rounded bg-forest-800 px-4 py-2 text-sm font-semibold text-cream-surface hover:bg-forest-700"
        >
          Analyse a new site
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-card border border-line bg-cream-surface p-4 shadow-card">
        <label className={label}>
          Sector
          <select value={sector} onChange={(e) => setSector(e.target.value)} className={select}>
            <option value="all">All sectors</option>
            {options.sectors.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className={label}>
          Stage
          <select value={stage} onChange={(e) => setStage(e.target.value)} className={select}>
            <option value="all">All stages</option>
            {options.stages.map((s) => (
              <option key={s} value={s}>
                {s} — {STAGE_LABELS[s] ?? ""}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          District
          <select value={location} onChange={(e) => setLocation(e.target.value)} className={select}>
            <option value="all">All districts</option>
            {options.locations.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <label className={label}>
          Risk
          <select value={risk} onChange={(e) => setRisk(e.target.value)} className={select}>
            <option value="all">All levels</option>
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </label>
        <label className={label}>
          Sort by
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className={select}
          >
            <option value="risk">Risk (worst first)</option>
            <option value="created_at">Newest</option>
            <option value="name">Name (A–Z)</option>
          </select>
        </label>

        <div className="ml-auto flex items-end gap-2">
          {anyFilter && (
            <button
              onClick={() => {
                setSector("all");
                setStage("all");
                setLocation("all");
                setRisk("all");
              }}
              className="rounded border border-line px-3 py-1.5 text-sm font-medium text-ink-2 hover:bg-cream-alt"
            >
              Clear
            </button>
          )}
          <div className="flex overflow-hidden rounded border border-line">
            {(["cards", "table"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={
                  view === v
                    ? "bg-forest-800 px-3 py-1.5 text-sm capitalize text-cream-surface"
                    : "bg-cream-surface px-3 py-1.5 text-sm capitalize text-ink-2 hover:bg-cream-alt"
                }
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-ink-3">
        {projects === null ? "Loading…" : `${filtered.length} of ${projects.length} projects`}
      </p>

      {projects === null ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-card bg-cream-deep" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-cream-surface p-12 text-center text-sm text-ink-3">
          No projects match these filters.
        </div>
      ) : view === "cards" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((p) => (
            <ProjectCard key={p.project_id} project={p} />
          ))}
        </div>
      ) : (
        <ProjectTable projects={filtered} />
      )}
    </main>
  );
}
