import Link from "next/link";
import type { Project } from "@/lib/types";
import { RiskBadge } from "./RiskBadge";

const RISK_RAIL: Record<string, string> = {
  Low: "bg-risk-low",
  Medium: "bg-risk-medium",
  High: "bg-risk-high",
  Critical: "bg-risk-critical",
};

const SEVERITY_DOT: Record<number, string> = {
  1: "bg-risk-critical",
  2: "bg-risk-high",
  3: "bg-ink-3",
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
    <article className="relative overflow-hidden rounded-card border border-line bg-cream-surface shadow-card transition-shadow hover:shadow-raised">
      {/* Severity rail — state encoded in form, not only colour */}
      <span
        className={`absolute inset-y-0 left-0 w-1 ${RISK_RAIL[p.risk_class] ?? "bg-line"}`}
        aria-hidden
      />

      <div className="p-5 pl-6">
        {/* Header: identity + verdict */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/projects/${project.project_id}`}
              className="text-base font-semibold tracking-tight text-ink hover:underline"
            >
              {project.name}
            </Link>
            <p className="mt-0.5 text-xs text-ink-3">
              {project.location} · {project.sector} · #{project.project_id}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <RiskBadge level={p.risk_class} probability={p.probability} />
            {delay && (
              <span className="font-mono text-[11px] text-ink-2">
                delay {delay.lower_days}–{delay.upper_days} days
              </span>
            )}
          </div>
        </div>

        {/* Quick facts */}
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
          <span className="rounded bg-forest-800 px-2 py-0.5 font-mono font-semibold text-cream-surface">
            {project.current_stage}
          </span>
          <span className="rounded bg-cream-deep px-2 py-0.5 text-ink-2">
            {project.paf_count ?? "—"} families
          </span>
          <span className="rounded bg-cream-deep px-2 py-0.5 text-ink-2">
            {project.area != null ? `${project.area} ha` : "—"}
          </span>
          {project.rehabilitation_progress_pct != null && (
            <span className="rounded bg-cream-deep px-2 py-0.5 text-ink-2">
              R&amp;R {Math.round(project.rehabilitation_progress_pct)}%
            </span>
          )}
          {p.missing_inputs.length > 0 && (
            <span className="rounded bg-risk-mediumBg px-2 py-0.5 text-risk-medium ring-1 ring-risk-medium/25">
              {p.missing_inputs.length} input{p.missing_inputs.length > 1 ? "s" : ""} assumed
            </span>
          )}
        </div>

        {/* Why */}
        {factors.length > 0 && (
          <div className="mt-4 border-t border-line-soft pt-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
              Top risk factors
            </p>
            <ol className="mt-1.5 space-y-1">
              {factors.map((f, i) => (
                <li key={f.feature} className="flex gap-2 text-xs text-ink-2">
                  <span className="font-mono text-ink-3">{i + 1}.</span>
                  <span>{f.explanation}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* What to do */}
        {actions.length > 0 && (
          <div className="mt-3.5 border-t border-line-soft pt-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
              Recommended actions
            </p>
            <ul className="mt-1.5 space-y-1">
              {actions.map((a) => (
                <li key={a.id} className="flex items-start gap-2 text-xs">
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                      SEVERITY_DOT[a.severity] ?? "bg-ink-3"
                    }`}
                    aria-hidden
                  />
                  <span className="text-ink-2">
                    {a.action}
                    <span className="text-ink-3"> · {a.owner}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {actions.length === 0 && factors.length > 0 && (
          <p className="mt-3.5 border-t border-line-soft pt-3 text-xs text-risk-low">
            No action triggered — compensation, litigation and schedule are all within range.
          </p>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-line-soft pt-3">
          <Link
            href={`/projects/${project.project_id}`}
            className="text-xs font-semibold text-ink-2 hover:underline"
          >
            Open project →
          </Link>
          <span className="font-mono text-[10px] text-ink-3">{p.model_version}</span>
        </div>
      </div>
    </article>
  );
}
