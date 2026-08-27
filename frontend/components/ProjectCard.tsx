import Link from "next/link";
import type { Project } from "@/lib/types";
import { RiskBadge } from "./RiskBadge";

const RISK_RAIL: Record<string, string> = {
  Low: "bg-teal-500",
  Medium: "bg-amber-500",
  High: "bg-orange-500",
  Critical: "bg-red-600",
};

const SEVERITY_DOT: Record<number, string> = {
  1: "bg-red-600",
  2: "bg-orange-500",
  3: "bg-slate-400",
};

/**
 * The output contract's card, rendered per project.
 *
 * Name, risk, predicted delay, the top factors, and the actions each one implies —
 * in that order, because that is the order an officer needs them: what, how bad,
 * why, and what to do.
 */
export function ProjectCard({ project }: { project: Project }) {
  const p = project.prediction;
  const delay = p.delay_estimate;
  const factors = p.factors.filter((f) => f.contribution > 0).slice(0, 4);
  const actions = p.recommendations.slice(0, 4);

  return (
    <article className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Severity rail — state encoded in form, not only colour */}
      <span
        className={`absolute inset-y-0 left-0 w-1 ${RISK_RAIL[p.risk_class] ?? "bg-slate-300"}`}
        aria-hidden
      />

      <div className="p-5 pl-6">
        {/* Header: identity + verdict */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/projects/${project.project_id}`}
              className="text-base font-semibold tracking-tight text-slate-900 hover:underline"
            >
              {project.name}
            </Link>
            <p className="mt-0.5 text-xs text-slate-500">
              {project.location} · {project.sector} · #{project.project_id}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <RiskBadge level={p.risk_class} probability={p.probability} />
            {delay && (
              <span className="font-mono text-[11px] text-slate-600">
                delay {delay.lower_days}–{delay.upper_days} days
              </span>
            )}
          </div>
        </div>

        {/* Quick facts */}
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
          <span className="rounded bg-slate-900 px-2 py-0.5 font-mono font-semibold text-white">
            {project.current_stage}
          </span>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">
            {project.paf_count ?? "—"} families
          </span>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">
            {project.area != null ? `${project.area} ha` : "—"}
          </span>
          {project.rehabilitation_progress_pct != null && (
            <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">
              R&amp;R {Math.round(project.rehabilitation_progress_pct)}%
            </span>
          )}
          {p.missing_inputs.length > 0 && (
            <span className="rounded bg-amber-50 px-2 py-0.5 text-amber-800 ring-1 ring-amber-200">
              {p.missing_inputs.length} input{p.missing_inputs.length > 1 ? "s" : ""} assumed
            </span>
          )}
        </div>

        {/* Why */}
        {factors.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">
              Top risk factors
            </p>
            <ol className="mt-1.5 space-y-1">
              {factors.map((f, i) => (
                <li key={f.feature} className="flex gap-2 text-xs text-slate-700">
                  <span className="font-mono text-slate-400">{i + 1}.</span>
                  <span>{f.explanation}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* What to do */}
        {actions.length > 0 && (
          <div className="mt-3.5 border-t border-slate-100 pt-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">
              Recommended actions
            </p>
            <ul className="mt-1.5 space-y-1">
              {actions.map((a) => (
                <li key={a.id} className="flex items-start gap-2 text-xs">
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                      SEVERITY_DOT[a.severity] ?? "bg-slate-400"
                    }`}
                    aria-hidden
                  />
                  <span className="text-slate-700">
                    {a.action}
                    <span className="text-slate-400"> · {a.owner}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {actions.length === 0 && factors.length > 0 && (
          <p className="mt-3.5 border-t border-slate-100 pt-3 text-xs text-teal-800">
            No action triggered — compensation, litigation and schedule are all within range.
          </p>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <Link
            href={`/projects/${project.project_id}`}
            className="text-xs font-semibold text-slate-700 hover:underline"
          >
            Open project →
          </Link>
          <span className="font-mono text-[10px] text-slate-400">{p.model_version}</span>
        </div>
      </div>
    </article>
  );
}
