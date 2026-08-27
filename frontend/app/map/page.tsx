"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { RiskBadge } from "@/components/RiskBadge";
import { fetchProjects } from "@/lib/api";
import { STAGE_LABELS } from "@/lib/stages";
import type { Project, RiskLevel } from "@/lib/types";

// Leaflet touches window on import, so it can never run during SSR.
const SiteMap = dynamic(() => import("@/components/SiteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-cream-deep text-sm text-ink-3">
      Loading map…
    </div>
  ),
});

const LEVELS: { level: RiskLevel; colour: string }[] = [
  { level: "Critical", colour: "#9e2a20" },
  { level: "High", colour: "#b3561d" },
  { level: "Medium", colour: "#97690d" },
  { level: "Low", colour: "#1f7a5c" },
];

export default function MapPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [active, setActive] = useState<Set<RiskLevel>>(
    new Set<RiskLevel>(["Critical", "High", "Medium", "Low"])
  );

  useEffect(() => {
    fetchProjects()
      .then(({ projects }) => setProjects(projects))
      .catch(() => setProjects([]));
  }, []);

  const shown = useMemo(
    () => (projects ?? []).filter((p) => active.has(p.prediction.risk_class)),
    [projects, active]
  );

  const toggle = (level: RiskLevel) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });

  const mapped = shown.filter((p) => p.latitude != null && p.longitude != null);

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-6 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Map view</h1>
        <p className="mt-1 text-sm text-ink-2">
          Acquisition sites by location, coloured by current delay risk.
        </p>
      </div>

      {/* Risk filters */}
      <div className="flex flex-wrap items-center gap-2 rounded-card border border-line bg-cream-surface p-3 shadow-card">
        <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
          Show
        </span>
        {LEVELS.map(({ level, colour }) => {
          const on = active.has(level);
          const count = (projects ?? []).filter((p) => p.prediction.risk_class === level).length;
          return (
            <button
              key={level}
              onClick={() => toggle(level)}
              aria-pressed={on}
              className={`flex items-center gap-2 rounded border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                on
                  ? "border-line bg-cream-alt text-ink"
                  : "border-line-soft bg-cream-surface text-ink-3 opacity-55"
              }`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colour }}
                aria-hidden
              />
              {level}
              <span className="lw-nums text-ink-3">{count}</span>
            </button>
          );
        })}
        <span className="ml-auto text-[11px] text-ink-3">
          {mapped.length} of {(projects ?? []).length} sites plotted
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="overflow-hidden rounded-card border border-line bg-cream-surface shadow-card">
          <div className="h-[32rem]">
            <SiteMap picked={null} onPick={() => {}} existing={shown} />
          </div>
        </div>

        {/* Site list beside the map */}
        <div className="rounded-card border border-line bg-cream-surface shadow-card">
          <p className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">Sites</p>
          {projects === null ? (
            <p className="px-4 py-6 text-sm text-ink-3">Loading…</p>
          ) : shown.length === 0 ? (
            <p className="px-4 py-6 text-sm text-ink-3">Nothing matches these filters.</p>
          ) : (
            <ul className="divide-y divide-line-soft">
              {shown.map((p) => (
                <li key={p.project_id}>
                  <Link
                    href={`/projects/${p.project_id}`}
                    className="block px-4 py-3 hover:bg-cream-alt"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-ink">{p.name}</span>
                      <RiskBadge level={p.prediction.risk_class} />
                    </div>
                    <p className="mt-0.5 text-[11px] text-ink-3">
                      {p.location} · {p.current_stage} {STAGE_LABELS[p.current_stage] ?? ""}
                    </p>
                    {p.latitude == null && (
                      <p className="mt-1 text-[11px] text-risk-medium">No coordinates recorded</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
