"use client";

import Link from "next/link";
import type { Project } from "@/lib/types";
import { RiskBadge } from "./RiskBadge";

const STAGE_ORDER: Record<string, number> = {
  "3A": 0,
  "3C": 1,
  "3D": 2,
  "3G": 3,
  "3H": 4,
  "3E": 5,
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function ProjectTable({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-cream-surface p-12 text-center text-sm text-ink-3">
        No projects found. Adjust filters or ingest data via the API.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card border bg-cream-surface shadow-card">
      {/* Desktop table — data-dense but uncluttered per Design Brief §2 */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream-alt text-xs uppercase tracking-wider text-ink-3">
            <tr>
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Sector</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">PAFs</th>
              <th className="px-4 py-3 font-medium">Area</th>
              <th className="px-4 py-3 font-medium">Risk</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {projects.map((p) => {
              const risk = p.prediction;
              return (
                <tr key={p.project_id} className="hover:bg-cream-alt/70">
                  <td className="px-4 py-3">
                    <Link
                      href={`/projects/${p.project_id}`}
                      className="font-medium text-ink hover:text-forest-600 hover:underline"
                    >
                      {p.name}
                    </Link>
                    <div className="text-xs text-ink-3">ID #{p.project_id}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-2">{p.location}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-cream-deep px-2 py-0.5 text-xs font-medium text-ink-2">
                      {p.sector}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded bg-forest-800 px-2 py-0.5 text-xs font-mono font-medium text-cream-surface">
                      {p.current_stage}
                    </span>
                    <span className="ml-1 text-xs text-ink-3">
                      ({STAGE_ORDER[p.current_stage] ?? "?"} / 5)
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-2">{p.paf_count ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-2">{p.area != null ? `${p.area} ha` : "—"}</td>
                  <td className="px-4 py-3">
                    <RiskBadge level={risk.risk_class} probability={risk.probability} />
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-3">{formatDate(p.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="divide-y md:hidden">
        {projects.map((p) => {
          const risk = p.prediction;
          return (
            <div key={p.project_id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/projects/${p.project_id}`}
                    className="block truncate font-medium text-ink hover:underline"
                  >
                    {p.name}
                  </Link>
                  <div className="text-xs text-ink-3">
                    {p.location} • {p.sector}
                  </div>
                </div>
                <RiskBadge level={risk.risk_class} probability={risk.probability} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-2">
                <span className="rounded bg-cream-deep px-2 py-1 font-mono">Stage {p.current_stage}</span>
                <span className="rounded bg-cream-deep px-2 py-1">PAFs: {p.paf_count ?? "—"}</span>
                <span className="rounded bg-cream-deep px-2 py-1">Area: {p.area != null ? `${p.area} ha` : "—"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
