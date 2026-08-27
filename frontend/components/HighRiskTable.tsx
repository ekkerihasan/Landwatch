import Link from "next/link";
import type { Project } from "@/lib/types";
import { RiskBadge } from "./RiskBadge";
import { STAGE_LABELS } from "@/lib/stages";

/**
 * The projects that need attention, in priority order.
 *
 * Stage labels come from lib/stages.ts, which mirrors the sections of the National
 * Highways Act 1956 as sourced in app/stages.py. 3A is notification, 3C is the
 * objection period and 3G is compensation — labelling them otherwise would put a
 * factual error about the statute on screen.
 */
export function HighRiskTable({ projects }: { projects: Project[] }) {
  const atRisk = projects
    .filter((p) => p.prediction.risk_class === "High" || p.prediction.risk_class === "Critical")
    .sort((a, b) => b.prediction.probability - a.prediction.probability);

  return (
    <div className="overflow-hidden rounded-card border border-line bg-cream-surface shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3.5">
        <div>
          <h2 className="text-sm font-semibold text-ink">Projects needing attention</h2>
          <p className="mt-0.5 text-xs text-ink-3">High and Critical risk, worst first</p>
        </div>
        <Link href="/projects" className="text-xs font-semibold text-forest-600 hover:underline">
          All projects →
        </Link>
      </div>

      {atRisk.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-ink-3">
          No project is currently at High or Critical risk.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line-soft bg-cream-alt text-[10px] uppercase tracking-[0.1em] text-ink-3">
                <th className="px-5 py-2.5 font-semibold">Project</th>
                <th className="px-4 py-2.5 font-semibold">District</th>
                <th className="px-4 py-2.5 font-semibold">Current stage</th>
                <th className="px-4 py-2.5 font-semibold">Risk</th>
                <th className="px-4 py-2.5 font-semibold">Predicted delay</th>
                <th className="px-4 py-2.5 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {atRisk.map((p) => {
                const district = p.location.split(",")[0]?.trim() ?? p.location;
                const delay = p.prediction.delay_estimate;
                const top = p.prediction.recommendations[0];
                return (
                  <tr key={p.project_id} className="hover:bg-cream-alt/70">
                    <td className="px-5 py-3">
                      <Link
                        href={`/projects/${p.project_id}`}
                        className="font-medium text-ink hover:underline"
                      >
                        {p.name}
                      </Link>
                      <div className="text-[11px] text-ink-3">#{p.project_id}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-2">{district}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-ink">
                        {p.current_stage}
                      </span>
                      <span className="ml-1.5 text-[11px] text-ink-3">
                        {STAGE_LABELS[p.current_stage] ?? ""}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge
                        level={p.prediction.risk_class}
                        probability={p.prediction.probability}
                      />
                    </td>
                    <td className="lw-nums px-4 py-3 text-ink-2">
                      {delay ? `${delay.lower_days}–${delay.upper_days} days` : "—"}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-ink-2">
                      {top ? top.action : <span className="text-ink-3">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
